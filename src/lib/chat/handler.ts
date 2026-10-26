import { chatCopy } from "@/content";
import { GeminiEmptyReplyError, GeminiHttpError, GeminiTimeoutError, GeminiTruncatedError, streamGemini, type GeminiTurn } from "@/lib/chat/gemini";
import { RESTART } from "@/lib/chat/protocol";
import { SYSTEM_PROMPT } from "@/lib/chat/system-prompt";
import { prepareMessages } from "@/lib/chat/validate";
import { visitorKey } from "@/lib/ip";
import { chatLimiters, type LimitEnv } from "@/lib/ratelimit";

/** Settings and secrets for the chat. In the Cloudflare Worker these are its vars and secrets. */
export type ChatEnv = LimitEnv & {
  GEMINI_API_KEY?: string;
  /** Comma-separated, tried in order. */
  GEMINI_MODELS?: string;
  /** "false" switches the chat off. */
  CHAT_ENABLED?: string;
  /** "1" returns canned replies without calling Gemini (tests and offline development). */
  CHAT_MOCK?: string;
  IP_HASH_SALT?: string;
};

/**
 * Tried in order. The Flash-Lite models lead: their free-tier quotas last much longer, and 3.8 Flash is
 * often overloaded on the free tier (it can take a minute just to say so).
 */
const DEFAULT_MODELS = "gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-3.8-flash";

const LINES = chatCopy.replies;
const BLOCKED = new Set(["SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII", "RECITATION", "IMAGE_SAFETY"]);

function plain(text: string, status: number) {
  return new Response(text, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

/**
 * The AI twin's chat endpoint: validates the conversation, applies per-visitor limits, then streams
 * a plain-text reply from Gemini. Framework-free (standard Request/Response), so it runs in the
 * Cloudflare Worker that serves the static site's chat.
 */
export async function handleChat(req: Request, env: ChatEnv): Promise<Response> {
  if (env.CHAT_ENABLED === "false") return plain(LINES.disabled, 503);
  const MODELS = (env.GEMINI_MODELS || DEFAULT_MODELS)
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return plain(LINES.invalid, 400);
  }
  const prepared = prepareMessages(body);
  if (!prepared.ok) return plain(LINES.invalid, 400);

  const key = await visitorKey(req.headers, env.IP_HASH_SALT);
  const limits = chatLimiters(env);
  const [minute, day] = await Promise.all([limits.perMinute.limit(key), limits.perDay.limit(key)]);
  if (!day.success) return plain(LINES.dailyLimit, 429);
  if (!minute.success) return plain(LINES.rateLimited, 429);

  if (env.CHAT_MOCK === "1") return mockStream(prepared.messages.at(-1)!.content);

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[chat] GEMINI_API_KEY is not set (wrangler secret put GEMINI_API_KEY, or .dev.vars locally)");
    return plain(LINES.disabled, 503);
  }

  let turns: GeminiTurn[] = prepared.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", text: m.content }));
  // Gemini's content filter sometimes blocks harmless questions outright (it rejects the exact text
  // "What is HealthStar?"). Quoting the message as visitor input gets past those false positives,
  // so a blocked question is retried once that way; a second block gets the polite refusal.
  let reframed = false;
  const quoteLastVisitorTurn = (all: GeminiTurn[]) => all.map((t, i) => (i === all.length - 1 ? { ...t, text: `Visitor message: "${t.text}"` } : t));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text));
      // True while the visitor can see part of a reply. A retry first sends RESTART to clear it.
      let visible = false;
      let lastError: unknown;

      try {
        // Brief glitches (dropped connection, empty or malformed reply, 500) get one retry on the same model.
        // A model that's out of quota (429), missing (404), overloaded (503) or too slow moves straight to
        // the next model: retrying it would only make the visitor wait. A rejected key (401/403) stops everything.
        for (const model of MODELS) {
          for (let attempt = 0; attempt < 2; attempt++) {
            if (visible) {
              send(RESTART);
              visible = false;
            }
            try {
              let finish: string | undefined;
              let promptBlocked = false;
              let tokens = { in: 0, out: 0 };
              for await (const event of streamGemini({
                apiKey,
                model,
                system: SYSTEM_PROMPT,
                turns,
                maxOutputTokens: 1024,
                // Lower than default: Flash-Lite occasionally slips into another language when it runs hot.
                temperature: 0.6,
                // A portfolio chat doesn't need deep reasoning. LOW is accepted by all the default models.
                thinkingLevel: "LOW",
                signal: req.signal,
              })) {
                if (event.text) {
                  send(event.text);
                  visible = true;
                }
                finish = event.finishReason ?? finish;
                promptBlocked ||= Boolean(event.promptBlocked);
                tokens = { in: event.promptTokens ?? tokens.in, out: event.outputTokens ?? tokens.out };
              }

              if (promptBlocked && !visible && !reframed) {
                console.warn(`[chat] ${model}: question blocked by the content filter, retrying it quoted`);
                reframed = true;
                turns = quoteLastVisitorTurn(turns);
                attempt--; // doesn't count as a failed attempt
                continue;
              }

              if (finish && BLOCKED.has(finish)) send(visible ? `\n\n${LINES.refusal}` : LINES.refusal);
              else if (!visible) throw new GeminiEmptyReplyError(finish);
              else if (finish === "MAX_TOKENS") send(`\n\n${LINES.maxTokens}`);

              // Token counts only: chat content is never logged.
              console.info(`[chat] model=${model} finish=${finish} in=${tokens.in} out=${tokens.out}${attempt ? " (retry)" : ""}`);
              return;
            } catch (err) {
              if (req.signal.aborted) return;
              lastError = err;
              const status = err instanceof GeminiHttpError ? err.status : undefined;
              if (status === 401 || status === 403) throw err;
              if (status === 429 || status === 404 || status === 503 || err instanceof GeminiTimeoutError) {
                console.warn(`[chat] ${model} unavailable (${err instanceof GeminiTimeoutError ? err.message : `status=${status}`}), trying the next model`);
                break;
              }
              const transient = err instanceof GeminiTruncatedError || err instanceof GeminiEmptyReplyError || status === undefined || status >= 500;
              if (!transient) throw err;
              console.warn(`[chat] ${model}: ${err instanceof Error ? err.message : err}${attempt === 0 ? ", retrying" : ", trying the next model"}`);
            }
          }
        }
        throw lastError;
      } catch (err) {
        if (req.signal.aborted) return;
        const status = err instanceof GeminiHttpError ? err.status : undefined;
        console.error(`[chat] giving up: ${err instanceof Error ? err.message : err}`);
        if (status === 401 || status === 403) console.error("[chat] check GEMINI_API_KEY: Google rejected it");
        const line = status === 429 ? LINES.quota : visible ? LINES.cutOff : LINES.error;
        send(visible ? `\n\n${line}` : line);
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed by an aborted request.
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}

/** Canned streaming reply for local development and end-to-end tests (CHAT_MOCK=1). */
function mockStream(question: string) {
  const reply = `Mock twin here. You asked: "${question.slice(0, 80)}". In real life I'd tell you about GenieA (10K+ users) or the rover that placed 6th globally at IRC. See /projects.`;
  const encoder = new TextEncoder();
  const words = reply.split(/(\s+)/);
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const w of words) {
        controller.enqueue(encoder.encode(w));
        await new Promise((r) => setTimeout(r, 15));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

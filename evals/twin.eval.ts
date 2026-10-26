import { existsSync, readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { handleChat, type ChatEnv } from "@/lib/chat/handler";
import { RESTART } from "@/lib/chat/protocol";
import { cases, type EvalCase } from "./cases";

/** GEMINI_API_KEY from the environment (CI), or from .dev.vars locally. */
function apiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (!existsSync(".dev.vars")) return undefined;
  return /^GEMINI_API_KEY=(.+)$/m.exec(readFileSync(".dev.vars", "utf8"))?.[1]?.trim();
}

const env: ChatEnv = { GEMINI_API_KEY: apiKey(), CHAT_LIMITS: "off", GEMINI_MODELS: process.env.GEMINI_MODELS };
const DELAY_MS = Number(process.env.EVAL_DELAY_MS ?? 2500);
/** Share of quality checks that must pass for a deploy to go ahead. */
const QUALITY_PASS_RATE = 0.85;

async function ask(c: EvalCase) {
  const messages = typeof c.ask === "string" ? [{ role: "user" as const, content: c.ask }] : c.ask;
  const res = await handleChat(new Request("https://eval.local/chat", { method: "POST", body: JSON.stringify({ messages }) }), env);
  const text = await res.text();
  // If a reply was retried mid-stream, only the final attempt counts.
  return { status: res.status, reply: text.slice(text.lastIndexOf(RESTART) + 1).trim() };
}

const lower = (s: string) => s.toLowerCase();
const matches = (reply: string, p: string | RegExp) => (typeof p === "string" ? lower(reply).includes(lower(p)) : p.test(reply));

/** Every problem with a reply, or an empty list if it passes. */
function problems(c: EvalCase, status: number, reply: string) {
  const found: string[] = [];
  if (status !== 200) found.push(`request failed (${status})`);
  for (const s of c.includesAll ?? []) if (!matches(reply, s)) found.push(`should include "${s}"`);
  if (c.includesAny && !c.includesAny.some((s) => matches(reply, s))) found.push(`should include one of ${JSON.stringify(c.includesAny)}`);
  for (const p of c.excludes ?? []) if (matches(reply, p)) found.push(`must not match ${p}`);
  const words = reply.split(/\s+/).filter(Boolean).length;
  if (words > (c.maxWords ?? 200)) found.push(`too long: ${words} words`);
  return found;
}

const quality = { passed: 0, failed: [] as string[] };

describe("AI twin", () => {
  beforeAll(() => {
    if (!env.GEMINI_API_KEY) throw new Error("No GEMINI_API_KEY: set it in the environment or in .dev.vars to run the twin evals.");
  });

  it.each(cases)("$name", async (c) => {
    await new Promise((r) => setTimeout(r, DELAY_MS)); // stay under free-tier requests-per-minute
    const { status, reply } = await ask(c);
    const found = problems(c, status, reply);
    const report = `${found.join("; ")}\n--- reply ---\n${reply}\n-------------`;

    if (c.critical) {
      expect(found, report).toEqual([]);
    } else if (found.length) {
      quality.failed.push(`${c.name}: ${report}`);
      console.warn(`[quality] ${c.name}: ${report}`);
    } else {
      quality.passed++;
    }
  });

  afterAll(() => {
    const total = quality.passed + quality.failed.length;
    if (!total) return;
    const rate = quality.passed / total;
    console.info(`[quality] ${quality.passed}/${total} quality checks passed (${Math.round(rate * 100)}%, need ${QUALITY_PASS_RATE * 100}%)`);
    if (rate < QUALITY_PASS_RATE) throw new Error(`Too many quality checks failed:\n\n${quality.failed.join("\n\n")}`);
  });
});

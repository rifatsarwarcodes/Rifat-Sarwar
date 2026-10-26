import { z } from "zod";

/** A typed chat message. */
export const MAX_INPUT_CHARS = 500;
/** A pasted job description (recruiter mode), plus its short lead-in line. */
export const MAX_JOB_DESCRIPTION_CHARS = 6000;
export const MAX_MESSAGE_CHARS = MAX_JOB_DESCRIPTION_CHARS + 500;
export const MAX_TURNS = 12;
export const MAX_TOTAL_CHARS = 16000;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
});

export const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
});

export type ChatMessage = z.infer<typeof messageSchema>;

/**
 * Validates the request body and trims history to what we are willing to pay for.
 * Returns alternating turns that start and end with a user message.
 */
export function prepareMessages(body: unknown): { ok: true; messages: ChatMessage[] } | { ok: false; error: string } {
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: "invalid_request" };

  let messages = parsed.data.messages.slice(-MAX_TURNS);

  // Must alternate user/assistant.
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].role === messages[i - 1].role) return { ok: false, error: "invalid_order" };
  }
  if (messages[messages.length - 1].role !== "user") return { ok: false, error: "last_not_user" };
  if (messages[messages.length - 1].content.length > MAX_MESSAGE_CHARS) return { ok: false, error: "too_long" };

  // Drop the oldest turns until under the character budget, keeping user-first order.
  const total = () => messages.reduce((n, m) => n + m.content.length, 0);
  while (messages.length > 1 && total() > MAX_TOTAL_CHARS) messages = messages.slice(1);
  while (messages[0].role !== "user") messages = messages.slice(1);

  return { ok: true, messages };
}

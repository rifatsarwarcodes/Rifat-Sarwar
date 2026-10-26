import { afterEach, describe, expect, it, vi } from "vitest";
import { chatCopy } from "@/content";
import { handleChat } from "@/lib/chat/handler";

const sse = (obj: unknown) => new Response(`data: ${JSON.stringify(obj)}\n\n`, { status: 200 });
const answer = (text: string) => sse({ candidates: [{ content: { parts: [{ text }] }, finishReason: "STOP" }] });
const blocked = () => sse({ promptFeedback: { blockReason: "PROHIBITED_CONTENT" } });

const env = { GEMINI_API_KEY: "k", CHAT_LIMITS: "off", GEMINI_MODELS: "m1,m2" };
const ask = (content: string) =>
  handleChat(new Request("https://x/chat", { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content }] }) }), env).then((r) => r.text());

afterEach(() => vi.unstubAllGlobals());

describe("chat handler", () => {
  it("retries a question the content filter blocked by mistake, quoted as visitor input", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(blocked()).mockResolvedValueOnce(answer("HealthStar is a healthcare app."));
    vi.stubGlobal("fetch", fetchMock);
    expect(await ask("What is HealthStar?")).toBe("HealthStar is a healthcare app.");
    const retried = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(retried.contents.at(-1).parts[0].text).toBe('Visitor message: "What is HealthStar?"');
  });

  it("gives the polite refusal if the quoted question is blocked too", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => blocked()));
    expect(await ask("something genuinely off-limits")).toBe(chatCopy.replies.refusal);
  });

  it("skips an overloaded model straight away instead of retrying it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("high demand", { status: 503 }))
      .mockResolvedValueOnce(answer("From the backup model."));
    vi.stubGlobal("fetch", fetchMock);
    expect(await ask("hi")).toBe("From the backup model.");
    expect(fetchMock.mock.calls.map((c) => String(c[0]).match(/models\/(\w+):/)?.[1])).toEqual(["m1", "m2"]);
  });
});

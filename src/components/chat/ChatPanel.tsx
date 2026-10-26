"use client";

import { ArrowUp, ArrowUpRight, RotateCcw, Square, X } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSound } from "@/components/effects/SoundProvider";
import type { ChatUiCopy } from "@/content";
import { MAX_INPUT_CHARS, MAX_JOB_DESCRIPTION_CHARS } from "@/lib/chat/validate";
import { cn, fill } from "@/lib/utils";
import { useChat } from "./ChatProvider";
import { SafeText } from "./SafeText";
import { useChatStream } from "./useChatStream";

export type ChatProjectLink = { slug: string; title: string };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Case studies a reply mentions, by path (/projects/<slug>) or by name, in the order they appear.
 * "Offline LLMs at Megamind" also matches plain "Megamind".
 */
export function mentionedProjects(text: string, projects: ChatProjectLink[]) {
  const found = projects
    .map((p) => {
      const names = [p.title, ...p.title.split(" at ").slice(1)].map(escape).join("|");
      const at = text.search(new RegExp(`/projects/${p.slug}\\b|\\b(?:${names})\\b`, "i"));
      return { p, at };
    })
    .filter((m) => m.at >= 0);
  return found.sort((a, b) => a.at - b.at).map((m) => m.p);
}

export default function ChatPanel({ copy, projects }: { copy: ChatUiCopy; projects: ChatProjectLink[] }) {
  const { closeChat, consumePendingQuestion, pendingQuestion } = useChat();
  const { messages, status, send, stop, reset } = useChatStream({ connectionLost: copy.connectionLost, stopped: copy.stopped });
  const { play } = useSound();
  const [input, setInput] = useState("");
  // Recruiter mode: the input becomes a paste box for a job description.
  const [jobMode, setJobMode] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const busy = status !== "idle";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!pendingQuestion || busy) return;
    const q = consumePendingQuestion();
    if (q) void send(q);
  }, [pendingQuestion, busy, consumePendingQuestion, send]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeChat();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeChat]);

  const submit = (text: string) => {
    if (!text.trim() || busy) return;
    play("send");
    setInput("");
    if (jobMode) {
      setJobMode(false);
      void send(`${copy.jobFit.prefix}\n\n${text.trim()}`);
    } else {
      void send(text);
    }
  };

  const toggleJobMode = (on: boolean) => {
    setJobMode(on);
    setInput("");
    inputRef.current?.focus();
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const last = messages[messages.length - 1];
  const showFollowUps = status === "idle" && last?.role === "assistant" && last.content.trim().length > 0;
  const asked = new Set(messages.filter((m) => m.role === "user").map((m) => m.content));
  const nextQuestions = copy.suggestions.filter((q) => !asked.has(q)).slice(0, 2);
  const caseStudies = showFollowUps ? mentionedProjects(last.content, projects).slice(0, 2) : [];

  return (
    <motion.div
      role="dialog"
      aria-labelledby="chat-title"
      aria-modal="false"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="fixed inset-x-2 bottom-2 z-50 flex max-h-[85dvh] flex-col overflow-hidden border-2 border-text bg-surface shadow-[6px_6px_0_var(--primary)] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:h-[36rem] sm:w-[25rem]"
    >
      <div className="flex items-center gap-3 border-b-2 border-text bg-surface-2 px-4 py-3">
        <span className="grid size-9 place-items-center border-2 border-text font-hand text-lg font-bold" aria-hidden>
          R<sub className="font-mono text-[0.55rem]">2</sub>
        </span>
        <div className="min-w-0 flex-1">
          <p id="chat-title" className="font-display leading-tight">
            {copy.title}
          </p>
          <p className="font-mono text-[0.68rem] tracking-wide text-muted uppercase">{copy.subtitle}</p>
        </div>
        {messages.length > 0 && (
          <button type="button" onClick={reset} className="grid size-9 place-items-center hover:text-primary" aria-label="Start a new conversation" title="New conversation">
            <RotateCcw size={17} />
          </button>
        )}
        <button type="button" onClick={closeChat} className="grid size-9 place-items-center hover:text-primary" aria-label="Close chat">
          <X size={19} />
        </button>
      </div>

      <div ref={logRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <p className="border border-border bg-surface-2 px-4 py-3 text-[0.95rem]">
              {copy.welcome}
            </p>
            <ul className="flex flex-wrap gap-2" aria-label="Suggested questions">
              {copy.suggestions.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => submit(q)}
                    className="border border-dashed border-border px-3 py-1.5 text-left text-sm transition-colors hover:border-primary hover:text-primary"
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <p
              className={cn(
                "max-w-[85%] px-4 py-2.5 text-[0.95rem] leading-relaxed whitespace-pre-wrap",
                m.role === "user" ? "bg-text text-bg" : "border border-border bg-surface-2",
              )}
            >
              {m.role === "assistant" ? (
                m.content ? (
                  <SafeText text={m.content} />
                ) : (
                  <span className="inline-flex items-center gap-1 font-mono text-sm text-muted" aria-label="Thinking">
                    {copy.thinking}<span className="animate-blink">_</span>
                  </span>
                )
              ) : m.content.startsWith(copy.jobFit.prefix) ? (
                <>
                  {copy.jobFit.prefix}
                  <span className="mt-1 block font-mono text-xs opacity-75">
                    [{fill(copy.jobFit.collapsed, { count: String(m.content.length - copy.jobFit.prefix.length) })}]
                  </span>
                </>
              ) : (
                m.content
              )}
            </p>
          </div>
        ))}

        {showFollowUps && (caseStudies.length > 0 || nextQuestions.length > 0) && (
          <div className="space-y-2 pt-1">
            {caseStudies.map((p) => (
              <Link
                key={p.slug}
                href={`/projects/${p.slug}/`}
                className="flex w-fit items-center gap-1.5 border border-text px-3 py-1.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
              >
                {fill(copy.followUps.caseStudy, { title: p.title })} <ArrowUpRight size={14} aria-hidden />
              </Link>
            ))}
            {nextQuestions.length > 0 && (
              <>
                <p className="font-mono text-[0.68rem] tracking-wide text-muted uppercase">{copy.followUps.more}</p>
                <ul className="flex flex-wrap gap-2" aria-label={copy.followUps.more}>
                  {nextQuestions.map((q) => (
                    <li key={q}>
                      <button
                        type="button"
                        onClick={() => submit(q)}
                        className="border border-dashed border-border px-3 py-1.5 text-left text-sm transition-colors hover:border-primary hover:text-primary"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      <div aria-live="polite" className="sr-only">
        {status === "idle" && lastAssistant ? lastAssistant.content : ""}
      </div>

      <form
        className="border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <div className="flex items-end gap-2 border-2 border-border bg-bg px-3 py-2 focus-within:border-text">
          <label htmlFor="chat-input" className="sr-only">
            Message the AI twin
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={jobMode ? 7 : 1}
            value={input}
            maxLength={jobMode ? MAX_JOB_DESCRIPTION_CHARS : MAX_INPUT_CHARS}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // Job descriptions are multi-line: Enter adds a line there, Ctrl/Cmd+Enter sends.
              const sendKey = jobMode ? e.key === "Enter" && (e.metaKey || e.ctrlKey) : e.key === "Enter" && !e.shiftKey;
              if (sendKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder={jobMode ? copy.jobFit.placeholder : copy.placeholder}
            className={cn(
              "min-h-6 flex-1 resize-none bg-transparent py-1 outline-none placeholder:text-muted focus-visible:outline-none",
              jobMode ? "max-h-60 text-sm" : "max-h-32",
            )}
          />
          {busy ? (
            <button type="button" onClick={stop} className="grid size-9 shrink-0 place-items-center bg-text text-bg" aria-label="Stop reply">
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="grid size-9 shrink-0 place-items-center bg-primary text-white transition-opacity disabled:opacity-40 dark:text-bg"
              aria-label="Send message"
            >
              <ArrowUp size={18} />
            </button>
          )}
        </div>
        <div className="mt-2 flex items-start justify-between gap-3 px-1">
          <p className="text-[0.7rem] text-muted">{copy.disclaimer}</p>
          <button
            type="button"
            onClick={() => toggleJobMode(!jobMode)}
            disabled={busy}
            className="shrink-0 font-mono text-[0.7rem] whitespace-nowrap text-primary underline underline-offset-2 disabled:opacity-40"
          >
            {jobMode ? copy.jobFit.cancel : copy.jobFit.button}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

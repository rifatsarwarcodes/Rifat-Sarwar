"use client";

import { MessageSquareText } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useSound } from "@/components/effects/SoundProvider";
import type { ChatUiCopy } from "@/content";
import type { ChatProjectLink } from "./ChatPanel";
import { useChat } from "./ChatProvider";

const ChatPanel = dynamic(() => import("./ChatPanel"), { ssr: false });

/** Floating launcher + lazily loaded chat panel, mounted once in the root layout. */
export function ChatRoot({ copy, projects }: { copy: ChatUiCopy; projects: ChatProjectLink[] }) {
  const { open, openChat } = useChat();
  const { play } = useSound();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Deep link: /?chat=open
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("chat") === "open") openChat();
  }, [openChat]);

  // Return focus to the launcher when the panel closes.
  useEffect(() => {
    if (wasOpen.current && !open) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            ref={launcherRef}
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={() => {
              play("whoosh");
              openChat();
            }}
            className="group fixed right-4 bottom-4 z-40 flex items-center gap-2 border-2 border-text bg-text py-2.5 pr-4 pl-3 font-semibold text-bg shadow-[4px_4px_0_var(--primary)] transition-transform hover:-translate-y-0.5 sm:right-6 sm:bottom-6"
            aria-label="Chat with Rifat's AI twin"
          >
            <MessageSquareText size={19} aria-hidden className="transition-transform group-hover:-rotate-12" />
            <span className="hidden sm:inline">{copy.launcher}</span>
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>{open && <ChatPanel key="chat" copy={copy} projects={projects} />}</AnimatePresence>
    </>
  );
}

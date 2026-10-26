import Link from "next/link";
import { Fragment } from "react";
import { ALLOWED_LINK_PREFIXES } from "@/lib/chat/allowed-links";

const TOKEN = /(https?:\/\/[^\s<>"]+|(?<![\w/])\/(?:projects(?:\/[a-z0-9-]+)?|papers\/[a-z0-9-]+\.pdf|contact|about)(?![\w-]))/g;

/** Models sometimes use markdown emphasis despite being told not to; show the words, not the asterisks. */
function stripEmphasis(text: string) {
  return text.replace(/\*\*([^*\n]+)\*\*/g, "$1").replace(/__([^_\n]+)__/g, "$1").replace(/(^|[\s(])\*([^*\s][^*\n]*?)\*(?=[\s.,!?;:)]|$)/g, "$1$2");
}

/**
 * Renders model output as plain text. Only allow-listed site paths and URLs
 * become links; nothing is ever interpreted as HTML or markdown.
 */
export function SafeText({ text }: { text: string }) {
  const parts = stripEmphasis(text).split(TOKEN);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        const trailing = /[.,!?;:)]+$/.exec(part)?.[0] ?? "";
        const href = trailing ? part.slice(0, -trailing.length) : part;
        if (!ALLOWED_LINK_PREFIXES.some((p) => href === p || href.startsWith(p))) return <Fragment key={i}>{part}</Fragment>;
        const className = "font-semibold text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary";
        return (
          <Fragment key={i}>
            {href.startsWith("/") && !href.endsWith(".pdf") ? (
              <Link href={href} className={className}>
                {href}
              </Link>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
                {href.startsWith("/") ? href : href.replace(/^https?:\/\/(www\.)?/, "").replace(/[?&]hl=en$/, "")}
              </a>
            )}
            {trailing}
          </Fragment>
        );
      })}
    </>
  );
}

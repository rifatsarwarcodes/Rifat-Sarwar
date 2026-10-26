import { ArrowDown, MessageSquareText } from "lucide-react";
import { ChatButton } from "@/components/chat/ChatButton";
import { Rich } from "@/components/Rich";
import { homeCopy, profile, siteCopy } from "@/content";
import { btnPrimary, btnSecondary } from "@/lib/utils";
import { Polaroid } from "./Polaroid";

function Ref({ n }: { n: number }) {
  return (
    <sup>
      <a id={`fnref-${n}`} href={`#fn-${n}`} className="px-0.5 font-mono text-[0.7em] font-semibold text-primary no-underline hover:underline" aria-label={`Footnote ${n}`}>
        {n}
      </a>
    </sup>
  );
}

export function Hero() {
  const copy = homeCopy.hero;
  return (
    <section className="relative" aria-labelledby="hero-title">
      <div className="container-page relative grid items-start gap-14 pt-12 pb-16 md:grid-cols-[1.3fr_0.7fr] md:pt-20 md:pb-20">
        <div>
          {copy.greeting && (
            <p className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span lang="bn" className="font-bangla text-xl text-text">
                {copy.greeting}
              </span>
              {copy.greetingNote && <span className="font-hand text-primary">{copy.greetingNote}</span>}
            </p>
          )}

          <h1 id="hero-title" className="font-display text-6xl leading-[0.95] sm:text-7xl lg:text-8xl">
            {profile.name}
          </h1>

          <p className="mt-6 font-display text-2xl leading-snug sm:text-3xl">
            <span className="struck">{copy.formerTitle}</span>{" "}
            <span className="relative whitespace-nowrap">
              <span className="pointer-events-none absolute -top-8 left-0 hidden font-hand text-lg whitespace-nowrap text-primary sm:block" aria-hidden>
                {copy.titleNote} ↓
              </span>
              {profile.title}
            </span>{" "}
            <Rich text={copy.titleRest} />
          </p>
          <p className="mt-1 font-hand text-lg text-primary sm:hidden" aria-hidden>
            ↑ {copy.titleNote}.
          </p>

          <p className="mt-6 max-w-xl text-lg">
            <Rich text={copy.lead} footnote={(n) => <Ref n={n} />} />
          </p>
          <p className="mt-3 max-w-xl text-lg text-muted">{profile.intro[1]}</p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a href="#changelog" className={btnPrimary}>
              {copy.changelogButton} <ArrowDown size={18} aria-hidden />
            </a>
            <ChatButton className={btnSecondary}>
              <MessageSquareText size={18} aria-hidden /> {copy.twinButton}
            </ChatButton>
          </div>

          <ol className="mt-12 max-w-xl space-y-1 border-t border-text/40 pt-3 text-sm text-muted sm:w-2/3" aria-label="Footnotes">
            {copy.footnotes.map((note, i) => (
              <li key={note} id={`fn-${i + 1}`} className="scroll-mt-24">
                <span className="font-mono text-primary">{i + 1}.</span> <Rich text={note} />{" "}
                <a href={`#fnref-${i + 1}`} className="no-underline hover:text-primary" aria-label={`Back to reference ${i + 1}`}>
                  ↩
                </a>
              </li>
            ))}
          </ol>
        </div>

        <div className="relative mx-auto w-full max-w-[19rem] rotate-2 md:mt-6">
          <Polaroid media={profile.headshot} copy={copy.photo} labels={siteCopy.photoHint} />
          <span className="stamp absolute top-6 -left-8 -rotate-12 bg-surface/70 text-sm whitespace-nowrap text-primary sm:-left-14">
            {copy.stamp.top}
            <span className="block text-center text-xs tracking-[0.2em]">{copy.stamp.bottom}</span>
          </span>
        </div>
      </div>
    </section>
  );
}

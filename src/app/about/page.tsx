import { MessageSquareText } from "lucide-react";
import type { Metadata } from "next";
import { ChatButton } from "@/components/chat/ChatButton";
import { Reveal } from "@/components/effects/Reveal";
import { Polaroid } from "@/components/home/Polaroid";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Rich } from "@/components/Rich";
import { aboutCopy as copy, profile, siteCopy } from "@/content";
import { btnPrimary } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About",
  description: copy.metaDescription,
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  return (
    <div className="container-page pt-16">
      <div className="grid gap-14 md:grid-cols-[1fr_18rem] md:items-start">
        <div>
          <p className="eyebrow mb-2">
            <span className="text-primary">§</span> {copy.eyebrow}
          </p>
          <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl">
            <Rich text={copy.title} />
          </h1>
          <div className="mt-8 space-y-5 text-lg">
            {copy.paragraphs.map((p) => (
              <p key={p}>
                <Rich text={p} />
              </p>
            ))}
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <ChatButton className={btnPrimary}>
              <MessageSquareText size={18} aria-hidden /> {copy.twinButton}
            </ChatButton>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[18rem] -rotate-2">
          <Polaroid media={profile.headshot} copy={copy.photo} labels={siteCopy.photoHint} />
        </div>
      </div>

      <Reveal>
        <section className="mt-24" aria-labelledby="faq-title">
          <SectionHeading id="faq-title" eyebrow={copy.faq.eyebrow} title={copy.faq.title} intro={copy.faq.intro} />
          <dl className="grid gap-x-12 gap-y-8 md:grid-cols-2">
            {copy.faq.items.map((item) => (
              <div key={item.q} className="border-t-2 border-text pt-4">
                <dt className="font-display text-2xl leading-tight">
                  <Rich text={item.q} />
                </dt>
                <dd className="mt-2 text-lg text-muted">
                  <Rich text={item.a} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-24" aria-labelledby="education-title">
          <SectionHeading id="education-title" eyebrow={copy.education.eyebrow} title={copy.education.title} intro={copy.education.intro} />
          <div className="relative max-w-2xl border border-border bg-surface p-6 font-mono text-sm shadow-card sm:p-8">
            <p className="text-center text-xs tracking-[0.25em] text-muted uppercase">{copy.education.heading}</p>
            <dl className="mt-6 grid grid-cols-[8rem_1fr] gap-y-2">
              {copy.education.rows.map((row) => (
                <div key={row.label} className="contents">
                  <dt className="text-muted">{row.label}</dt>
                  <dd>
                    <Rich text={row.value} />
                  </dd>
                </div>
              ))}
            </dl>
            <span className="stamp absolute right-4 -bottom-4 -rotate-6 bg-surface text-sm text-mint">{copy.education.stamp}</span>
          </div>
        </section>
      </Reveal>
    </div>
  );
}

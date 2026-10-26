import { ArrowLeft, ArrowRight, ArrowUpRight, MessageSquareText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatButton } from "@/components/chat/ChatButton";
import { Reveal } from "@/components/effects/Reveal";
import { SmartMedia } from "@/components/media/SmartMedia";
import { ArchitectureDiagram } from "@/components/projects/ArchitectureDiagram";
import { PhoneMockup } from "@/components/projects/PhoneMockup";
import { StoreBadges } from "@/components/projects/StoreBadges";
import { Rich } from "@/components/Rich";
import { getProject, profile, projects, projectsPageCopy } from "@/content";
import { projectJsonLd } from "@/lib/seo";
import { accentTextVar, fill } from "@/lib/utils";

const copy = projectsPageCopy.caseStudy;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.tagline,
    alternates: { canonical: `/projects/${project.slug}/` },
    openGraph: { title: `${project.title} · ${profile.name}`, description: project.tagline, url: `/projects/${project.slug}/` },
  };
}

function Section({ n, title, children, color }: { n: number; title: string; children: React.ReactNode; color: string }) {
  return (
    <Reveal>
      <section className="grid gap-4 border-t border-dashed border-border py-10 md:grid-cols-[14rem_1fr]" aria-labelledby={`section-${n}`}>
        <h2 id={`section-${n}`} className="font-display text-2xl">
          <span className="mb-1 block font-mono text-xs tracking-widest" style={{ color }}>
            § {String(n).padStart(2, "0")}
          </span>
          {title}
        </h2>
        <div className="space-y-3 text-lg">{children}</div>
      </section>
    </Reveal>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-[0.7rem] h-0.5 w-3 shrink-0 bg-primary" aria-hidden />
          <span>
            <Rich text={item} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const index = projects.findIndex((p) => p.slug === slug);
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const textColor = accentTextVar[project.accent];
  const jsonLd = projectJsonLd(slug);
  let n = 0;

  return (
    <article className="container-page pt-12">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      <Link href="/projects" className="inline-flex items-center gap-1.5 font-mono text-sm text-muted hover:text-primary">
        <ArrowLeft size={16} aria-hidden /> {copy.back}
      </Link>

      <header className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="eyebrow">
            <span style={{ color: textColor }}>{copy.eyebrow}</span> · {project.period}
          </p>
          <h1 className="mt-3 font-display text-5xl sm:text-7xl">{project.title}</h1>
          <p className="mt-4 text-xl text-muted">{project.tagline}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:max-w-md">
            <div>
              <dt className="eyebrow">{copy.role}</dt>
              <dd className="mt-1 font-semibold">{project.role}</dd>
            </div>
            <div>
              <dt className="eyebrow">{copy.where}</dt>
              <dd className="mt-1 font-semibold">{project.org}</dd>
            </div>
            {project.status && (
              <div>
                <dt className="eyebrow">{copy.status}</dt>
                <dd className="mt-1 font-hand text-xl leading-tight" style={{ color: textColor }}>
                  {project.status}
                </dd>
              </div>
            )}
          </dl>
          <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-muted">
            {project.badges.map((b) => (
              <li key={b}>#{b.toLowerCase().replace(/\s+/g, "-")}</li>
            ))}
          </ul>
          <div className="mt-6">
            <StoreBadges links={project.storeLinks} copy={copy} />
          </div>
          {project.links.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {project.links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-sm underline decoration-primary decoration-2 underline-offset-4 hover:text-primary"
                  >
                    {l.label}
                    <ArrowUpRight size={14} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-center">
          {project.screenGroups.length > 0 ? (
            <PhoneMockup groups={project.screenGroups} title={project.title} />
          ) : (
            <div className="w-full overflow-hidden border-2 border-text shadow-card">
              <SmartMedia media={project.cover} preload sizes="(min-width: 1024px) 45vw, 100vw" />
            </div>
          )}
        </div>
      </header>

      {project.detailsPending && (
        <div className="mt-12 flex flex-col gap-3 border-l-4 border-gold-bright bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">
            <span className="font-semibold text-text">{copy.draftTitle}</span> {copy.draftText}
          </p>
          <ChatButton
            question={fill(copy.draftQuestion, { title: project.title })}
            className="inline-flex shrink-0 items-center gap-2 border-2 border-text px-4 py-2 font-semibold transition-shadow hover:shadow-[3px_3px_0_var(--primary)]"
          >
            <MessageSquareText size={17} className="text-primary" aria-hidden /> {fill(copy.draftButton, { title: project.title })}
          </ChatButton>
        </div>
      )}

      <div className="mt-10">
        <Section n={++n} title={copy.sections.brief} color={textColor}>
          {project.brief.map((p) => (
            <p key={p}>
              <Rich text={p} />
            </p>
          ))}
        </Section>
        <Section n={++n} title={copy.sections.role} color={textColor}>
          <Bullets items={project.myRole} />
        </Section>
        {project.architecture && (
          <Section n={++n} title={copy.sections.architecture} color={textColor}>
            <ArchitectureDiagram architecture={project.architecture} accent={project.accent} />
          </Section>
        )}
        <Section n={++n} title={copy.sections.stack} color={textColor}>
          <ul className="flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <li key={s} className="border border-border bg-surface px-3 py-1 font-mono text-sm">
                {s}
              </li>
            ))}
          </ul>
        </Section>
        <Section n={++n} title={copy.sections.results} color={textColor}>
          <Bullets items={project.results} />
        </Section>
        {project.sideways && project.sideways.length > 0 && (
          <Section n={++n} title={copy.sections.sideways} color={textColor}>
            <Bullets items={project.sideways} />
          </Section>
        )}
        {project.gallery.length > 0 && (
          <Section n={++n} title={copy.sections.gallery} color={textColor}>
            <div className="grid gap-4 sm:grid-cols-2">
              {project.gallery.map((m) => (
                <figure key={m.alt} className={`self-start overflow-hidden border border-border bg-surface ${m.height > m.width ? "max-w-xs" : ""}`}>
                  {/* Own block, so h-full media sizes to its aspect ratio instead of the stretched grid cell. */}
                  <div>
                    <SmartMedia media={m} sizes="(min-width: 640px) 40vw, 100vw" />
                  </div>
                  {m.caption && <figcaption className="px-3 py-2 font-hand text-lg text-muted">{m.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </Section>
        )}
      </div>

      <nav aria-label="More projects" className="mt-8 grid gap-4 border-t-2 border-text pt-10 sm:grid-cols-2">
        <Link href={`/projects/${prev.slug}`} className="group border-2 border-text bg-surface p-5 transition-shadow hover:shadow-[4px_4px_0_var(--primary)]">
          <span className="eyebrow inline-flex items-center gap-1">
            <ArrowLeft size={14} aria-hidden /> {copy.previous}
          </span>
          <span className="mt-1 block font-display text-2xl group-hover:text-primary">{prev.title}</span>
        </Link>
        <Link href={`/projects/${next.slug}`} className="group border-2 border-text bg-surface p-5 text-right transition-shadow hover:shadow-[4px_4px_0_var(--primary)]">
          <span className="eyebrow inline-flex items-center gap-1">
            {copy.next} <ArrowRight size={14} aria-hidden />
          </span>
          <span className="mt-1 block font-display text-2xl group-hover:text-primary">{next.title}</span>
        </Link>
      </nav>
    </article>
  );
}

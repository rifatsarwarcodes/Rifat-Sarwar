import { achievements, journey, profile, projects, research, skillGroups, twinNotes } from "@/content";

/**
 * Turns the site content into the AI twin's knowledge base.
 * Must be deterministic (no dates, no randomness, stable order) so the system
 * prompt is byte-identical between requests and prompt caching keeps working.
 */
export function buildKnowledge(): string {
  const lines: string[] = [];
  const push = (...l: string[]) => lines.push(...l);

  push(
    "## Profile",
    `Name: ${profile.name}`,
    `Title: ${profile.title} | ${profile.specialties}`,
    `Based in: ${profile.location}`,
    `In my own words: "${profile.voice}"`,
    ...profile.intro.map((p) => `- ${p}`),
    `Contact: the contact form at /contact, email ${profile.email}, LinkedIn ${profile.links.linkedin}`,
    ...(profile.links.github ? [`GitHub: ${profile.links.github}`] : []),
    "",
    "## Education",
    `${profile.education.degree}, ${profile.education.school} (${profile.education.schoolShort}), ${profile.education.period}, CGPA ${profile.education.cgpa}. Graduated in 2026.`,
    "(The site presents this career as a playful CHANGELOG with joke \"known issues\"; those jokes are not facts.)",
    "",
    "## Career journey (chronological)",
  );

  for (const stop of journey) {
    push(
      `### ${stop.period}: ${stop.role}, ${stop.org}${stop.orgNote ? ` (${stop.orgNote})` : ""}${stop.current ? " [current]" : ""}`,
      stop.summary,
      ...stop.highlights.map((h) => `- ${h}`),
      ...(stop.projectSlug ? [`Case study: /projects/${stop.projectSlug}`] : []),
      "",
    );
  }

  push("## Projects (case studies)");
  for (const p of projects) {
    push(
      `### ${p.title} (/projects/${p.slug})`,
      `${p.tagline}`,
      `Organisation: ${p.org}. Role: ${p.role}. Period: ${p.period}.${p.status ? ` Status: ${p.status}.` : ""}`,
      "Brief:",
      ...p.brief.map((b) => `- ${b}`),
      "What I did:",
      ...p.myRole.map((r) => `- ${r}`),
      ...(p.architecture
        ? [`Architecture: ${p.architecture.stages.map((s) => `${s.label} (${s.nodes.join(", ")})`).join(" -> ")}`]
        : []),
      `Tech / areas: ${p.stack.join(", ")}`,
      "Results:",
      ...p.results.map((r) => `- ${r}`),
      ...(p.sideways?.length ? ["What went sideways:", ...p.sideways.map((s) => `- ${s}`)] : []),
      ...p.storeLinks
        .filter((s) => s.href)
        .map((s) => `${s.app ? `${s.app} on ` : ""}${s.store === "play" ? "Google Play" : "App Store"}: ${s.href}`),
      ...p.links.map((l) => `${l.label}: ${l.href}`),
      ...(p.storeLinks.some((s) => !s.href) ? ["Also on the App Store (link not listed here yet)."] : []),
      "",
    );
  }

  push("## Research (all 2026)");
  for (const r of research) {
    push(
      `### ${r.title}`,
      `${r.venue}${r.note ? `. ${r.note}` : ""}.${r.authors ? ` Authors: ${r.authors.join(", ")}.` : ""} Full PDF: ${r.pdf}`,
      ...r.points.map((pt) => `- ${pt}`),
      `In one line: ${r.tldr}`,
      "",
    );
  }

  push("## Achievements");
  for (const a of achievements) {
    push(`- ${a.event} (${a.eventShort}): ${a.result}${a.details.length ? `; ${a.details.join("; ")}` : ""}${a.team ? ` (with ${a.team})` : ""}`);
  }
  push("", "## Skills");
  for (const g of skillGroups) {
    push(`- ${g.title}: ${g.skills.join(", ")}`);
  }

  // content/twin.json: Rifat's own answers and behind-the-scenes stories. Blank entries are skipped.
  const answers = twinNotes.answers.filter((a) => a.answer.trim());
  if (answers.length) {
    push("", "## In my own words (notes from Rifat)");
    for (const a of answers) push(`### ${a.topic}`, `Q: ${a.question}`, a.answer.trim(), "");
  }
  const stories = twinNotes.stories.filter((s) => s.story.trim());
  if (stories.length) {
    push("", "## Behind the scenes (stories from Rifat)");
    for (const s of stories) {
      const title = projects.find((p) => p.slug === s.project)?.title ?? s.project;
      push(`### ${title} (/projects/${s.project})`, s.story.trim(), "");
    }
  }

  return lines.join("\n");
}

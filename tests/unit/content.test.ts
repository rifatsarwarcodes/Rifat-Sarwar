import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { profile, projects, research, type Media } from "@/content";

const publicDir = join(process.cwd(), "public");

function allMedia(): Array<{ where: string; media: Media }> {
  const items: Array<{ where: string; media: Media }> = [{ where: "profile.headshot", media: profile.headshot }];
  for (const p of projects) {
    items.push({ where: `${p.slug}.cover`, media: p.cover });
    p.screenGroups.forEach((g) => g.screens.forEach((m, i) => items.push({ where: `${p.slug}.${g.label}[${i}]`, media: m })));
    p.gallery.forEach((m, i) => items.push({ where: `${p.slug}.gallery[${i}]`, media: m }));
  }
  return items;
}

describe("content", () => {
  it("every media src points at a real file in /public", () => {
    const missing = allMedia()
      .flatMap(({ where, media }) => [
        media.src && !existsSync(join(publicDir, media.src)) ? `${where}: ${media.src}` : null,
        media.poster && !existsSync(join(publicDir, media.poster)) ? `${where} poster: ${media.poster}` : null,
      ])
      .filter(Boolean);
    expect(missing).toEqual([]);
  });

  it("every paper PDF exists", () => {
    expect(research.filter((p) => !existsSync(join(publicDir, p.pdf))).map((p) => p.pdf)).toEqual([]);
  });


  it("has all six case studies", () => {
    expect(projects.map((p) => p.slug)).toEqual(["genie-a", "health-star", "star-watch", "project-altair", "project-aero", "megamind-llm"]);
  });
});

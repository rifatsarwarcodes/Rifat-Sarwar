import { z } from "zod";
import aboutJson from "../../content/about.json";
import awardsJson from "../../content/awards.json";
import changelogJson from "../../content/changelog.json";
import chatJson from "../../content/chat.json";
import contactJson from "../../content/contact.json";
import errorsJson from "../../content/errors.json";
import homeJson from "../../content/home.json";
import profileJson from "../../content/profile.json";
import projectsPageJson from "../../content/projects-page.json";
import projectsJson from "../../content/projects.json";
import researchJson from "../../content/research.json";
import siteJson from "../../content/site.json";
import skillsJson from "../../content/skills.json";
import twinJson from "../../content/twin.json";
import {
  type ChatUiCopy,
  aboutCopySchema,
  achievementSchema,
  chatCopySchema,
  contactCopySchema,
  errorsCopySchema,
  homeCopySchema,
  journeyStopSchema,
  paperSchema,
  profileSchema,
  projectSchema,
  projectsPageCopySchema,
  siteCopySchema,
  skillGroupSchema,
  twinNotesSchema,
} from "./schema";

export type {
  AboutCopy,
  Achievement,
  ChatCopy,
  ChatUiCopy,
  ContactCopy,
  ContactFormCopy,
  HomeCopy,
  JourneyStop,
  Media,
  Paper,
  Profile,
  Project,
  ProjectsPageCopy,
  SiteCopy,
  SkillGroup,
  Stat,
  TwinNotes,
} from "./schema";

/**
 * All of the site's words live in /content/*.json so they can be edited without touching code.
 * Each file is validated at build time: a typo fails the build with the file and field named,
 * instead of shipping a broken page.
 */
function load<T extends z.ZodType>(file: string, schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) throw new Error(`content/${file}.json is invalid:\n${z.prettifyError(result.error)}`);
  return result.data;
}

export const profile = load("profile", profileSchema, profileJson);
export const journey = load("changelog", z.array(journeyStopSchema), changelogJson);
export const projects = load("projects", z.array(projectSchema), projectsJson);
export const research = load("research", z.array(paperSchema), researchJson);
export const achievements = load("awards", z.array(achievementSchema), awardsJson);
export const skillGroups = load("skills", z.array(skillGroupSchema), skillsJson);

export const siteCopy = load("site", siteCopySchema, siteJson);
export const homeCopy = load("home", homeCopySchema, homeJson);
export const aboutCopy = load("about", aboutCopySchema, aboutJson);
export const contactCopy = load("contact", contactCopySchema, contactJson);
export const projectsPageCopy = load("projects-page", projectsPageCopySchema, projectsPageJson);
export const errorsCopy = load("errors", errorsCopySchema, errorsJson);
export const chatCopy = load("chat", chatCopySchema, chatJson);
/** What the browser needs from chat.json; the canned replies and the persona stay on the server. */
export const chatUiCopy = Object.fromEntries(
  Object.entries(chatCopy).filter(([key]) => key !== "replies" && key !== "voice" && key !== "examples"),
) as ChatUiCopy;
/** Only the AI twin reads this (via its knowledge base); no page renders it. */
export const twinNotes = load("twin", twinNotesSchema, twinJson);

const slugs = new Set(projects.map((p) => p.slug));
if (slugs.size !== projects.length) throw new Error("content/projects.json has a duplicate slug");
for (const story of twinNotes.stories) {
  if (!slugs.has(story.project)) throw new Error(`Unknown project "${story.project}" in content/twin.json stories`);
}
for (const ref of [...journey, ...achievements]) {
  if (ref.projectSlug && !slugs.has(ref.projectSlug)) {
    throw new Error(`Unknown projectSlug "${ref.projectSlug}" in "${ref.id}" (content/changelog.json or content/awards.json)`);
  }
}

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

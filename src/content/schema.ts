import { z } from "zod";

/**
 * Every image/video on the site. `src` is optional: leave it out and the site
 * renders a themed placeholder of the same size until the real file is added
 * under /public (see public/images/README.md).
 */
export const mediaSchema = z.object({
  src: z.string().startsWith("/").optional(),
  alt: z.string().min(3),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  kind: z.enum(["image", "video"]).default("image"),
  /** Poster frame for videos. */
  poster: z.string().startsWith("/").optional(),
  caption: z.string().optional(),
  /** Placeholder icon while `src` is missing. */
  placeholder: z.enum(["phone", "desktop", "drone", "rover", "person", "trophy", "brain"]).default("desktop"),
});
export type Media = z.infer<typeof mediaSchema>;

export const linkSchema = z.object({
  label: z.string(),
  href: z.url(),
});

export const profileSchema = z.object({
  name: z.string(),
  firstName: z.string(),
  title: z.string(),
  specialties: z.string(),
  location: z.string(),
  voice: z.string(),
  intro: z.array(z.string()).min(1),
  email: z.email(),
  links: z.object({
    linkedin: z.url(),
    github: z.url().optional(),
  }),
  headshot: mediaSchema,
  education: z.object({
    degree: z.string(),
    school: z.string(),
    schoolShort: z.string(),
    period: z.string(),
    cgpa: z.string(),
  }),
});
export type Profile = z.infer<typeof profileSchema>;

export const journeyStopSchema = z.object({
  id: z.string(),
  period: z.string(),
  org: z.string(),
  orgNote: z.string().optional(),
  role: z.string(),
  kind: z.enum(["education", "work", "team"]),
  /** Semver for a career. Rendered as the CHANGELOG heading. */
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  summary: z.string(),
  highlights: z.array(z.string()).min(1),
  /** The joke. Keep it a joke: no new facts in here. */
  knownIssues: z.string().optional(),
  projectSlug: z.string().optional(),
  current: z.boolean().default(false),
});
export type JourneyStop = z.infer<typeof journeyStopSchema>;

export const storeLinkSchema = z.object({
  store: z.enum(["play", "app"]),
  href: z.url().optional(),
  /** Which app this badge is for, when a project ships more than one (e.g. "Police app"). */
  app: z.string().optional(),
});

export const screenGroupSchema = z.object({
  label: z.string(),
  screens: z.array(mediaSchema).min(1),
});

export const projectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  tagline: z.string(),
  org: z.string(),
  role: z.string(),
  period: z.string(),
  category: z.enum(["app", "ai", "robotics"]),
  status: z.string().optional(),
  badges: z.array(z.string()).default([]),
  accent: z.enum(["primary", "gold", "sky", "mint"]),
  cover: mediaSchema,
  /** Phone-style app screens (rendered in a device frame). */
  screenGroups: z.array(screenGroupSchema).default([]),
  /** Photos/videos rendered as a gallery. */
  gallery: z.array(mediaSchema).default([]),
  storeLinks: z.array(storeLinkSchema).default([]),
  /** Live product pages and other outside links, shown under the store badges. */
  links: z.array(linkSchema).default([]),
  brief: z.array(z.string()).min(1),
  myRole: z.array(z.string()).min(1),
  architecture: z
    .object({
      caption: z.string(),
      stages: z.array(z.object({ label: z.string(), nodes: z.array(z.string()).min(1) })).min(2),
    })
    .optional(),
  stack: z.array(z.string()).min(1),
  results: z.array(z.string()).min(1),
  sideways: z.array(z.string()).optional(),
  /** Shown as "more details coming soon" until Rifat fills the case study in. */
  detailsPending: z.boolean().default(false),
});
export type Project = z.infer<typeof projectSchema>;

export const achievementSchema = z.object({
  id: z.string(),
  result: z.string(),
  event: z.string(),
  eventShort: z.string(),
  team: z.string().optional(),
  details: z.array(z.string()).default([]),
  projectSlug: z.string().optional(),
});
export type Achievement = z.infer<typeof achievementSchema>;

export const skillGroupSchema = z.object({
  id: z.string(),
  /** Shown as a command-line option in the `man rifat` page. */
  flag: z.string().startsWith("--"),
  title: z.string(),
  blurb: z.string(),
  skills: z.array(z.string()).min(1),
});
export type SkillGroup = z.infer<typeof skillGroupSchema>;

export const statSchema = z.object({
  value: z.string(),
  label: z.string(),
});
export type Stat = z.infer<typeof statSchema>;

export const paperSchema = z.object({
  id: z.string(),
  title: z.string(),
  venue: z.string(),
  /** As printed on the PDF. Leave out when the PDF names no authors (e.g. double-blind review). */
  authors: z.array(z.string()).optional(),
  note: z.string().optional(),
  year: z.string(),
  /** Public path of the full paper. */
  pdf: z.string().startsWith("/papers/").endsWith(".pdf"),
  /** The one number worth circling in red pen. */
  headline: z.object({ value: z.string(), label: z.string() }),
  points: z.array(z.string()).min(1),
  tldr: z.string(),
});
export type Paper = z.infer<typeof paperSchema>;

/* ------------------------------------------------------------------------------------------
 * Page copy. Every visible sentence on the site lives in content/*.json and is checked here.
 * strictObject: a misspelt key fails the build instead of silently showing nothing.
 * ---------------------------------------------------------------------------------------- */

const text = z.string().min(1);
const link = z.strictObject({ label: text, href: text });
const sectionCopy = z.strictObject({ eyebrow: text, title: text, intro: text.optional(), aside: text.optional() });
const photoCopy = z.strictObject({ caption: text, back: z.array(text), punchline: text, hint: text, hintFlipped: text });

export const homeCopySchema = z.strictObject({
  hero: z.strictObject({
    /** Optional line above the name (e.g. a greeting), with a handwritten note beside it. */
    greeting: text.optional(),
    greetingNote: text.optional(),
    formerTitle: text,
    titleNote: text,
    titleRest: text,
    lead: text,
    footnotes: z.array(text),
    changelogButton: text,
    twinButton: text,
    photo: photoCopy,
    stamp: z.strictObject({ top: text, bottom: text }),
  }),
  ticker: z.array(statSchema).min(1),
  sections: z.strictObject({
    changelog: sectionCopy,
    shipped: sectionCopy.extend({ allLink: text }),
    research: sectionCopy,
    awards: sectionCopy,
    toolbox: sectionCopy,
  }),
  changelog: z.strictObject({
    repo: text,
    file: text,
    tagline: text,
    preamble: text,
    unreleasedText: text,
    added: text,
    knownIssues: text,
    current: text,
    caseStudyLink: text,
  }),
  research: z.strictObject({ tldr: text, pdfLink: text }),
  receipt: z.strictObject({
    store: text,
    storeLines: z.array(text),
    cashier: text,
    date: text,
    subtotal: text,
    eventsUnit: text,
    extras: z.array(z.strictObject({ label: text, value: text })),
    total: text,
    totalValue: text,
    footnote: text,
    thanks: text,
    barcode: text,
    note: text,
    credit: text,
    reprint: text,
    link,
  }),
  manPage: z.strictObject({
    prompt: text,
    header: z.tuple([text, text, text]),
    name: text,
    synopsis: text,
    description: text,
    exitStatus: text,
    bugs: z.array(text),
    seeAlso: z.array(link),
    footer: z.tuple([text, text, text]),
  }),
  interview: sectionCopy.extend({ hint: text, noteTitle: text, questions: z.array(text).min(1) }),
  postcard: z.strictObject({
    ariaLabel: text,
    heading: text,
    body: text,
    signoff: text,
    postmark: z.array(text),
    to: text,
    via: text,
    path: text,
  }),
});
export type HomeCopy = z.infer<typeof homeCopySchema>;

export const aboutCopySchema = z.strictObject({
  metaDescription: text,
  eyebrow: text,
  title: text,
  paragraphs: z.array(text).min(1),
  twinButton: text,
  photo: photoCopy,
  faq: sectionCopy.extend({ items: z.array(z.strictObject({ q: text, a: text })) }),
  education: sectionCopy.extend({ heading: text, rows: z.array(z.strictObject({ label: text, value: text })), stamp: text }),
});
export type AboutCopy = z.infer<typeof aboutCopySchema>;

export const contactCopySchema = z.strictObject({
  metaDescription: text,
  eyebrow: text,
  title: text,
  intro: text,
  emailLabel: text,
  linkedinLabel: text,
  linkedinText: text,
  githubLabel: text,
  githubText: text,
  note: text,
  noteButton: text,
  form: z.strictObject({
    nameLabel: text,
    namePlaceholder: text,
    emailLabel: text,
    emailPlaceholder: text,
    messageLabel: text,
    messagePlaceholder: text,
    submit: text,
    submitHint: text,
    errorSummary: text,
    errors: z.strictObject({ nameShort: text, nameLong: text, email: text, messageShort: text, messageLong: text }),
    emailSubject: text,
    emailSignature: text,
    success: z.strictObject({ stamp: text, title: text, text, retryPrefix: text, retry: text, copyPrefix: text, another: text }),
  }),
});
export type ContactCopy = z.infer<typeof contactCopySchema>;
export type ContactFormCopy = ContactCopy["form"];

const groupCopy = z.strictObject({ title: text, intro: text });
export const projectsPageCopySchema = z.strictObject({
  metaDescription: text,
  eyebrow: text,
  title: text,
  intro: text,
  aside: text,
  groups: z.strictObject({ app: groupCopy, ai: groupCopy, robotics: groupCopy }),
  card: z.strictObject({ number: text, categories: z.strictObject({ app: text, ai: text, robotics: text }) }),
  caseStudy: z.strictObject({
    back: text,
    eyebrow: text,
    role: text,
    where: text,
    status: text,
    draftTitle: text,
    draftText: text,
    draftButton: text,
    draftQuestion: text,
    sections: z.strictObject({
      brief: text,
      role: text,
      architecture: text,
      stack: text,
      results: text,
      sideways: text,
      gallery: text,
    }),
    previous: text,
    next: text,
    storePlay: text,
    storeApp: text,
    storeComingSoon: text,
  }),
});
export type ProjectsPageCopy = z.infer<typeof projectsPageCopySchema>;

const errorCopy = z.strictObject({ stamp: text, title: text, text, note: text.optional(), button: text });
export const errorsCopySchema = z.strictObject({ notFound: errorCopy, error: errorCopy });

export const chatCopySchema = z.strictObject({
  launcher: text,
  title: text,
  subtitle: text,
  welcome: text,
  suggestions: z.array(text).min(1),
  placeholder: text,
  disclaimer: text,
  thinking: text,
  stopped: text,
  connectionLost: text,
  replies: z.strictObject({
    disabled: text,
    rateLimited: text,
    dailyLimit: text,
    quota: text,
    invalid: text,
    refusal: text,
    maxTokens: text,
    error: text,
    cutOff: text,
  }),
  voice: z.array(text).min(1),
  /** Recruiter mode: paste a job description and get a fit assessment. */
  jobFit: z.strictObject({ button: text, placeholder: text, prefix: text, cancel: text, collapsed: text }),
  followUps: z.strictObject({ caseStudy: text, more: text }),
  /** Model answers that show the twin the tone, length and honesty expected. Server-only. */
  examples: z.array(z.strictObject({ visitor: text, twin: text })).min(1),
});
export type ChatCopy = z.infer<typeof chatCopySchema>;
/** The slice of chat copy the browser needs (reply lines, voice and examples stay on the server). */
export type ChatUiCopy = Omit<ChatCopy, "replies" | "voice" | "examples">;

/**
 * content/twin.json: things only the AI twin knows (not shown on the site's pages).
 * Blank answers are skipped, so questions can be filled in over time.
 */
export const twinNotesSchema = z.strictObject({
  answers: z.array(z.strictObject({ topic: text, question: text, answer: z.string() })),
  stories: z.array(z.strictObject({ project: text, prompt: text, story: z.string() })),
});
export type TwinNotes = z.infer<typeof twinNotesSchema>;

export const siteCopySchema = z.strictObject({
  seo: z.strictObject({ description: text, keywords: z.array(text) }),
  nav: z.array(link).min(1),
  header: z.strictObject({ twinButton: text, mobileTwinButton: text, versionTitle: text }),
  theme: z.strictObject({ toBlueprint: text, toPaper: text }),
  footer: z.strictObject({
    tagline: text,
    indexTitle: text,
    index: z.array(link),
    elsewhereTitle: text,
    bugs: text,
    bugsAside: text,
    disclaimer: text,
  }),
  copied: text,
  photoHint: z.strictObject({ flip: text, flipBack: text }),
  console: z.strictObject({ title: text, body: text }),
  ogImage: z.strictObject({ eyebrow: text, subtitle: text, footer: text, projectEyebrow: text, projectFooter: text }),
});
export type SiteCopy = z.infer<typeof siteCopySchema>;

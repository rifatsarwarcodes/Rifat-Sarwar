# Editing the site's words

Every sentence on the site lives in this folder. Change a `.json` file and the site changes. You never need to open `src/`.

- **Locally:** run `npm run dev`. Saved changes show up in the browser straight away.
- **Live site:** commit and push (or edit the file on GitHub and commit there). GitHub Pages rebuilds in a couple of minutes. The AI twin learns the change when its worker is redeployed (automatic if the Cloudflare token is set up; see the main README).

## Which file has what

| File | What's in it |
| --- | --- |
| `profile.json` | Your name, title, intro, email, links, headshot, education |
| `site.json` | Navigation, footer, SEO description and keywords, theme-button tooltips, link-preview image text |
| `home.json` | Everything on the home page: hero, footnotes, photo captions, ticker numbers, section headings, changelog labels, receipt, man page, interview note, postcard |
| `changelog.json` | Each career release on the home page (version, dates, role, highlights, known issues) |
| `projects.json` | The case studies: taglines, your role, stack, results, screenshots, photos and videos |
| `research.json` | Papers: title, authors, venue, headline number, points, tl;dr, PDF path |
| `awards.json` | Competition results printed on the receipt |
| `skills.json` | The `man rifat` options: flag, blurb, skills |
| `about.json` | About page: paragraphs, FAQ, transcript |
| `contact.json` | Contact page and form: labels, placeholders, error messages, email subject |
| `projects-page.json` | Projects index and the labels on every case-study page |
| `chat.json` | AI twin: welcome message, suggested questions, error replies, recruiter-mode wording, its personality ("voice") and example answers |
| `twin.json` | Things only the AI twin knows: your own answers to questions about how you work, plus behind-the-scenes project stories. Not shown on the pages, but the repo is public. Blank answers are skipped |
| `errors.json` | The 404 page and the crash page |

The AI twin learns everything it knows from these files too. Update a project here and the twin knows about it after the next build.

## Formatting inside text

Most text fields understand a few markers. Markers don't nest.

| Write | You get |
| --- | --- |
| `==text==` | highlighter |
| `~~text~~` | red-pen strikethrough |
| `**text**` | bold |
| `*text*` | italic |
| `` `text` `` | code |
| `[label](/projects)` | link (paths starting with `/` stay on the site; `https://` opens a new tab; `.pdf` files open directly) |
| `[^1]` | footnote marker (hero only; the footnote text goes in `hero.footnotes`) |

Some strings use placeholders in curly braces, like `{title}` or `{name}`. Keep those exactly as they are; the site fills them in.

## Rules that keep the build happy

1. **It must stay valid JSON.** Use double quotes, put commas between items, and no comma after the last one. If you're unsure, paste the file into a JSON validator.
2. **Don't rename keys** (the part before the colon). The build checks every file, and a typo stops it with a message naming the exact spot:

   ```
   content/home.json is invalid:
   ✖ Unrecognized key: "titelNote"
     → at hero
   ```

   That's on purpose: a typo stops the deploy instead of breaking the live site.
3. **Images and videos** go in `public/`; reference them from `/`, e.g. `"src": "/images/projects/Aero.jpeg"`, and set `width`/`height` to the file's real pixel size. Leave `src` out to show a placeholder. `npm test` checks that every file you reference exists.
4. **Facts feed the AI twin.** It is told to repeat only what's written here, so keep facts accurate. Jokes are fine; the twin is told not to treat the changelog's "known issues" as facts.

After editing, `npm test` checks every file in about a second. `node scripts/format-content.mjs` re-indents the files neatly if they get messy.

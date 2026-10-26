import { expect, test } from "@playwright/test";
// Expected text comes from the content files, so editing copy doesn't break these tests.
import changelog from "../../content/changelog.json";
import errors from "../../content/errors.json";
import home from "../../content/home.json";
import projectsPage from "../../content/projects-page.json";
import site from "../../content/site.json";

const SLUGS = ["genie-a", "health-star", "star-watch", "project-altair", "project-aero", "megamind-llm"];

test("home page renders the key sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Rifat");
  for (const section of [home.sections.changelog, home.sections.awards, home.sections.research]) {
    await expect(page.getByRole("heading", { name: section.title })).toBeVisible();
  }
  await expect(page.locator("#changelog ol > li")).toHaveCount(changelog.length);
});

test("every case study page renders", async ({ page }) => {
  for (const slug of SLUGS) {
    const res = await page.goto(`/projects/${slug}`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: projectsPage.caseStudy.sections.brief })).toBeVisible();
  }
});

test("main navigation works", async ({ page, isMobile }) => {
  await page.goto("/");
  for (const { label, href: path } of site.nav.filter((n) => !n.href.includes("#"))) {
    if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
    const nav = page.getByRole("navigation", { name: isMobile ? "Mobile" : "Main" });
    await nav.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}/?$`));
  }
});

test("theme toggle persists across reloads and is applied before paint", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("reduced motion turns sounds off", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Sounds are off because reduced motion/ })).toBeDisabled();
});

test("unknown routes show the lost-rover 404", async ({ page }) => {
  const res = await page.goto("/this-does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: errors.notFound.title })).toBeVisible();
});

test("no CV is published", async ({ request, page }) => {
  for (const path of ["/cv/", "/resume/"]) expect((await request.get(path)).status()).toBe(404);
  await page.goto("/about/");
  expect(await page.locator('a[href*=".pdf"]').filter({ hasText: /cv/i }).count()).toBe(0);
});

test("the headshot flips over to show the back", async ({ page }) => {
  await page.goto("/");
  const photo = page.getByRole("button", { name: site.photoHint.flip });
  await photo.click();
  await expect(page.getByRole("button", { name: site.photoHint.flipBack })).toHaveAttribute("aria-pressed", "true");
});

test("link-preview images are real PNGs", async ({ request, page }) => {
  await page.goto("/");
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og).toMatch(/\/opengraph-image\.png\?/);
  const res = await request.get(new URL(og!).pathname);
  expect(res.headers()["content-type"]).toBe("image/png");
});

test("sitemap and robots are generated", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const slug of SLUGS) expect(sitemap).toContain(`/projects/${slug}`);
  expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
});

// Runs after `next build` (npm "postbuild") to finish the static export for GitHub Pages.
// Link-preview images: Next exports them as extensionless "opengraph-image" files, which Pages would
// serve as application/octet-stream. Rename them to .png and point the pages at the new name.
import { readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const out = join(root, "out");

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else files.push(path);
  }
})(out);

let images = 0;
for (const file of files.filter((f) => f.endsWith("/opengraph-image"))) {
  renameSync(file, `${file}.png`);
  images++;
}
let pages = 0;
for (const file of files.filter((f) => /\.(html|txt)$/.test(f))) {
  const text = readFileSync(file, "utf8");
  const fixed = text.replace(/\/opengraph-image\?/g, "/opengraph-image.png?");
  if (fixed !== text) {
    writeFileSync(file, fixed);
    pages++;
  }
}

console.log(`postbuild: ${images} preview images renamed to .png, ${pages} files updated`);

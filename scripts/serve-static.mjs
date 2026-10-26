// Serves ./out the way GitHub Pages does (used by the e2e tests and `npm run preview`):
// /about -> 301 to /about/, /about/ -> about/index.html, unknown paths -> 404.html.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = join(import.meta.dirname, "..", "out");
const port = Number(process.env.PORT ?? process.argv[2] ?? 3000);
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".ico": "image/x-icon", ".mp4": "video/mp4", ".pdf": "application/pdf", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2",
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
  const file = normalize(join(root, path));
  if (!file.startsWith(root)) return res.writeHead(403).end();

  if (existsSync(file) && statSync(file).isDirectory() && !path.endsWith("/")) {
    return res.writeHead(301, { Location: `${path}/` }).end();
  }
  const candidates = [file, join(file, "index.html"), `${file}.html`];
  const found = candidates.find(isFile);
  const target = found ?? join(root, "404.html");
  res.writeHead(found ? 200 : 404, { "Content-Type": types[extname(target)] ?? "application/octet-stream" });
  createReadStream(target).pipe(res);
}).listen(port, () => console.log(`serving ./out on http://localhost:${port}`));

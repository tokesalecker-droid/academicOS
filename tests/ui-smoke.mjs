import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { createRequire } from "node:module";
import { extname, join, normalize, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE ?? "playwright");

const root = resolve(".");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = normalize(url.pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(root, requestedPath === "/" ? "index.html" : requestedPath);

  if (!resolve(filePath).startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const stats = statSync(filePath);
    if (stats.isDirectory()) filePath = join(filePath, "index.html");
    response.writeHead(200, { "Content-Type": types[extname(filePath)] ?? "application/octet-stream" });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const { port } = server.address();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Fächer" }).click();
await page.getByRole("button", { name: "Hinzufügen" }).click();
await page.getByRole("button", { name: "Termine" }).click();
await page.getByRole("button", { name: "Analyse" }).click();

const title = await page.locator("h1").textContent();
if (title !== "AcademicOS") throw new Error("AcademicOS title did not render");
if (errors.length) throw new Error(errors.join("\n"));

await browser.close();
await new Promise((resolveClose) => server.close(resolveClose));

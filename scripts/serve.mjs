import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = resolve(fileURLToPath(new URL("../dist", import.meta.url)));
const port = Number(process.env.PORT ?? 4173);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".zip": "application/zip"
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const target = resolve(siteRoot, `.${pathname.endsWith("/") ? `${pathname}index.html` : pathname}`);

  if (relative(siteRoot, target).startsWith("..") || !existsSync(target)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, { "Content-Type": mimeTypes[extname(target)] ?? "application/octet-stream" });
  createReadStream(target).pipe(response);
}).listen(port, () => {
  console.log(`Jasmin Wang Skills Library: http://localhost:${port}/skills/`);
});

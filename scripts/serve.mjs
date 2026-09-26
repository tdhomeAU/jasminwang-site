import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { handleLeadCapture } from "./kit-lead-capture.mjs";

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
  if (pathname === "/api/subscribe") {
    const leadCaptureRequest = new Request(new URL(request.url, `http://${request.headers.host ?? "localhost"}`), {
      method: request.method,
      headers: request.headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request,
      duplex: "half",
    });
    handleLeadCapture(leadCaptureRequest, {
      ...process.env,
      KIT_MOCK_MODE: process.env.KIT_MOCK_MODE ?? "true",
    }).then(async (result) => {
      response.writeHead(result.status, Object.fromEntries(result.headers));
      response.end(Buffer.from(await result.arrayBuffer()));
    }).catch(() => {
      response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ ok: false, error: "暂时无法提交，请稍后再试。" }));
    });
    return;
  }
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

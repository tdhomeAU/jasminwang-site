import { readFile, readdir, realpath } from "node:fs/promises";
import { extname, join, relative, basename } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { catalog } from "../dist/assets/catalog.js";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const allowedExtensions = new Set([".html", ".css", ".js", ".json"]);
const forbiddenPatterns = [
  /SKILL\.md/i,
  /C:\\Users\\/i,
  /\.codex[\\/]/i,
  /JASMIN IDEA KITCHEN/i,
  /private skill/i,
];

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? filesUnder(path) : [path];
    })
  );
  return nested.flat();
}

const files = await filesUnder(root);
const failures = [];

for (const file of files) {
  if (!allowedExtensions.has(extname(file))) continue;
  const content = await readFile(file, "utf8");
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      failures.push(`${relative(root, file)} matched ${pattern}`);
    }
  }
}

const manifest = JSON.parse(
  await readFile(join(root, "downloads", "release-manifest.json"), "utf8")
);

for (const release of manifest.releases) {
  if (release.status !== "published" && release.artifact) {
    failures.push(
      `${release.slug} has an artifact before its public release is published`
    );
  }
}

// Verify the approved release receipt and packaged bytes in every environment.
// When the original approved library is available locally, also compare against its source file.
const approvedRoot = fileURLToPath(new URL("../../skill-library/04 公开技能库（已审可发布）/", import.meta.url));
let approvedRootAvailable = true;
try {
  await realpath(approvedRoot);
} catch (error) {
  if (error.code === "ENOENT") approvedRootAvailable = false;
  else throw error;
}
const receipts = JSON.parse(await readFile(new URL("../public-download-sources.json", import.meta.url), "utf8"));
const declaredArtifacts = new Set();
for (const release of manifest.releases) {
  if (!release.artifact) continue;
  const receipt = receipts.find((entry) => entry.artifact === release.artifact);
  if (!receipt || !receipt.cleanTestPassed) {
    failures.push(release.slug + " has no passed release receipt");
    continue;
  }
  if (!/^\/downloads\/[^/\\]+\.zip$/.test(release.artifact) ||
      basename(receipt.approvedFile) !== receipt.approvedFile) {
    failures.push(release.slug + " has an invalid download path");
    continue;
  }
  try {
    const publicPath = join(root, release.artifact.slice(1));
    const publicBytes = await readFile(publicPath);
    const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
    if (digest(publicBytes) !== receipt.sha256.toLowerCase()) {
      throw new Error("Public download does not match approved release receipt");
    }
    if (approvedRootAvailable) {
      const approvedBase = await realpath(approvedRoot);
      const approvedPath = await realpath(join(approvedBase, receipt.approvedFile));
      if (relative(approvedBase, approvedPath) !== receipt.approvedFile) throw new Error("Source escaped approved library");
      const sourceBytes = await readFile(approvedPath);
      if (digest(sourceBytes) !== receipt.sha256.toLowerCase()) {
        throw new Error("Approved library source differs from release receipt");
      }
    }
    declaredArtifacts.add(publicPath);
  } catch (error) {
    failures.push(release.slug + ": " + error.message);
  }
}
for (const file of files) {
  if (relative(join(root, "downloads"), file).startsWith("..")) continue;
  if (file !== join(root, "downloads", "release-manifest.json") && !declaredArtifacts.has(file)) {
    failures.push("Unapproved download file: " + relative(root, file));
  }
}
for (const skill of catalog.skills) {
  const release = manifest.releases.find((entry) => entry.slug === skill.slug);
  if (!release || skill.publicRelease.status !== release.status ||
      skill.publicRelease.artifact !== release.artifact) {
    failures.push(skill.slug + " catalog and release manifest differ");
  }
}

if (failures.length) {
  console.error("Public boundary check failed:\n" + failures.join("\n"));
  process.exit(1);
}

console.log(`Public boundary check passed (${files.length} files checked).`);

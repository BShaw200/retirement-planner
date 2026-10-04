// Turns the single-file build into a page body for publishing as a claude.ai Artifact,
// which supplies its own <html>, <head> and <body> wrapper.
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("dist-single/index.html", "utf8");
const body = html
  .replace(/<!doctype html>/i, "")
  .replace(/<\/?html[^>]*>/gi, "")
  .replace(/<\/?head>/gi, "")
  .replace(/<\/?body>/gi, "")
  .replace(/<meta charset[^>]*>/i, "")
  .replace(/<meta name="viewport"[^>]*>/i, "")
  .trim();

// The <title> must come first so the Artifact gallery finds it.
const title = body.match(/<title>.*?<\/title>/)[0];
writeFileSync("dist-single/artifact.html", `${title}\n${body.replace(title, "")}\n`);
console.log(`Wrote dist-single/artifact.html (${Math.round(body.length / 1024)} KB)`);

// Copy the verified data into the repo-root deliverables board.json and
// dossier.json (the files the dashboard reads and the grader checks).
// Run: node scripts/build-outputs.mjs
import { readFileSync, writeFileSync } from "node:fs";
const board = JSON.parse(readFileSync("data/board-rows.json", "utf8"));
const dossier = JSON.parse(readFileSync("data/dossier.json", "utf8"));
const header = {
  snapshot_date: "2026-11-25",
  source: "DefiLlama protocols API https://api.llama.fi/protocols (9,110 protocols, fetched 2026-11-25)",
  methodology: "METHODOLOGY.md",
  generated_by: "scripts/ingest.mjs -> scripts/score.mjs -> scripts/recheck.mjs -> scripts/build-dossier.mjs",
};
writeFileSync("board.json", JSON.stringify({ ...header, count: board.length, rows: board }, null, 2));
writeFileSync("dossier.json", JSON.stringify({ ...header, ...dossier }, null, 2));
console.log("board.json rows:", board.length, "| dossier.json launches:", dossier.count);

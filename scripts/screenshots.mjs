// Take the three required screenshots with Puppeteer:
//   screenshots/board.png        — the board
//   screenshots/board-detail.png — a protocol detail view (Polymarket, #1)
//   screenshots/dossier.png      — the dossier view
// Starts the dashboard server itself, waits for the views to render,
// and shuts down. Run: node scripts/screenshots.mjs
// Requires: npm install puppeteer  (downloads Chrome; screenshots only)
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const PORT = 3123;
const server = spawn("node", ["main.ts"], {
  env: { ...process.env, PORT: String(PORT), OUTPUT_DIR: "output" },
  stdio: "ignore",
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(tries = 30) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`http://localhost:${PORT}/board.json`);
      if (r.ok) return;
    } catch {}
    await sleep(1000);
  }
  throw new Error("dashboard server did not start");
}

try {
  const { default: puppeteer } = await import("puppeteer");
  await waitForServer();
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const shots = [
    [`http://localhost:${PORT}/#/board`, "screenshots/board.png"],
    [`http://localhost:${PORT}/#/detail/polymarket-international`, "screenshots/board-detail.png"],
    [`http://localhost:${PORT}/#/dossier`, "screenshots/dossier.png"],
  ];
  for (const [url, file] of shots) {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
    await sleep(1500); // let the JS render the view
    await page.screenshot({ path: file });
    console.log("saved", file);
  }
  await browser.close();
} finally {
  server.kill();
}
console.log("done.");

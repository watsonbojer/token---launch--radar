// Retry the dropped rows: the first pass used concurrent HEAD requests and
// defillama.com refused many sockets (UND_ERR_SOCKET) — almost certainly
// rate-limiting, not dead links. Re-check each dead link with GET,
// one at a time, up to 3 attempts. Rows whose links all come back live
// are scored and merged back into data/board-rows.json (re-ranked).
// Run: node scripts/recheck.mjs
import { readFileSync, writeFileSync } from "node:fs";

const dropped = JSON.parse(readFileSync("data/dropped.json", "utf8"));
const candidates = JSON.parse(readFileSync("data/candidates.json", "utf8"));
const board = JSON.parse(readFileSync("data/board-rows.json", "utf8"));
const checks = JSON.parse(readFileSync("data/evidence-checks.json", "utf8"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, timeoutMs = 12000) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 (token-radar-01 evidence recheck)", Accept: "text/html,*/*" },
      });
      await r.arrayBuffer().catch(() => null);
      return { status: r.status, live: r.status >= 200 && r.status < 400 || r.status === 403 || r.status === 405 };
    } catch (e) {
      if (attempt === 3) return { status: null, live: false, error: String(e?.cause?.code || e?.name || e) };
      await sleep(2000);
    } finally {
      clearTimeout(t);
    }
  }
}

const bySlug = new Map(candidates.map((c) => [c.slug, c]));
const stillDropped = [];
const revived = [];

for (const d of dropped) {
  const c = bySlug.get(d.slug);
  let allLive = true;
  const results = [];
  for (const dead of d.dead) {
    await sleep(800);
    const r = await get(dead.url);
    results.push({ label: dead.label, url: dead.url, status: r.status, live: r.live, error: r.error || null, rechecked: true });
    if (!r.live) allLive = false;
  }
  if (allLive) {
    // Rebuild the row the same way score.mjs does, by reusing its evidence.
    const check = checks.checks.find((x) => x.slug === d.slug);
    const evidence = check.results.map((r) => {
      const rr = results.find((x) => x.label === r.label);
      return { label: r.label, url: r.url, status: rr ? rr.status : r.status, verified_at: "2026-11-25" };
    });
    revived.push({ slug: d.slug, name: d.name, evidence });
    console.log("REVIVED", d.slug);
  } else {
    stillDropped.push({ ...d, recheck: results });
    console.log("STILL DEAD", d.slug, JSON.stringify(results.map((r) => [r.label, r.status, r.error])));
  }
}

// Score revived rows with the same formula as score.mjs (duplicated here
// so recheck is standalone).
const CATEGORY_MULTIPLE = {
  "Prediction Market": 0.45, Dexs: 0.35, Derivatives: 0.32, Perps: 0.32,
  Lending: 0.3, "Dex Aggregator": 0.3, RWA: 0.28, "Uncollateralized Lending": 0.28,
  "Lending Aggregator": 0.28, CDP: 0.25, Insurance: 0.25, "Yield Aggregator": 0.22,
  "Basis Trading": 0.22, Options: 0.22, "Options Vault": 0.2, "Liquidity Manager": 0.2,
  "Algo-Stables": 0.2, Yield: 0.18, "Leveraged Farming": 0.15, Farm: 0.1,
};
function cleanUrl(u) {
  try {
    const x = new URL(u);
    for (const k of [...x.searchParams.keys()]) if (/^utm_|^ref$|^join$|^ref_/i.test(k)) x.searchParams.delete(k);
    return x.toString();
  } catch { return u; }
}
function scoreRow(c) {
  const tvlScore = 40 * Math.max(0, Math.min(1, (Math.log10(c.tvl) - Math.log10(3e6)) / (Math.log10(1e9) - Math.log10(3e6))));
  const mult = CATEGORY_MULTIPLE[c.category] ?? 0.2;
  const catScore = mult >= 0.45 ? 20 : mult >= 0.35 ? 20 : mult >= 0.32 ? 18 : mult >= 0.3 ? 17 : mult >= 0.28 ? 16 : mult >= 0.25 ? 15 : mult >= 0.22 ? 13 : mult >= 0.2 ? 12 : mult >= 0.18 ? 11 : mult >= 0.15 ? 9 : 6;
  const chainsScore = Math.min((c.chains || []).length, 10);
  const ageYears = c.listedAt ? (Date.parse("2026-11-25T00:00:00Z") / 1000 - c.listedAt) / 31557600 : null;
  const maturityScore = ageYears === null ? 5 : (Math.min(Math.max(ageYears, 0), 3) / 3) * 10;
  const ch7 = typeof c.change_7d === "number" ? Math.max(-20, Math.min(50, c.change_7d)) : 0;
  const momentumScore = ((ch7 + 20) / 70) * 10;
  const auditsScore = (Math.min(c.audits || 0, 2) / 2) * 10;
  return { score: Math.min(Math.round((tvlScore + catScore + chainsScore + maturityScore + momentumScore + auditsScore) * 10) / 10, 100), implied: Math.round(c.tvl * mult), mult,
    components: { tvl: Math.round(tvlScore * 10) / 10, category: catScore, chains: chainsScore, maturity: Math.round(maturityScore * 10) / 10, momentum_7d: Math.round(momentumScore * 10) / 10, audits: auditsScore } };
}
const FARM_VERBS = { Dexs: "trade and provide liquidity", Lending: "supply assets and borrow against them", Derivatives: "trade perpetuals / derivatives with small, managed positions", "Prediction Market": "trade markets and provide liquidity where offered", Yield: "deposit into the yield vaults", "Yield Aggregator": "deposit into the vaults", RWA: "use the tokenised-asset products on offer", CDP: "open a collateralised position", "Options Vault": "deposit into the options vaults", "Leveraged Farming": "open a leveraged farming position with strict risk limits", "Uncollateralized Lending": "use the credit markets as a lender where permitted", Insurance: "buy cover / provide cover capital where offered", "Liquidity Manager": "deposit into managed liquidity positions", "Basis Trading": "use the basis / delta-neutral products on offer", Farm: "use the farming pools on offer", "Algo-Stables": "use the stablecoin products on offer", Options: "trade options with small, managed positions", Perps: "trade perpetuals with small, managed positions", "Dex Aggregator": "route trades through the aggregator", "Lending Aggregator": "supply through the aggregated lending markets" };

for (const r of revived) {
  const c = bySlug.get(r.slug);
  const s = scoreRow(c);
  const verb = FARM_VERBS[c.category] || "use the protocol";
  const chains = (c.chains || []).slice(0, 3).join(", ") || "its supported chains";
  board.push({
    rank: 0, slug: c.slug, name: c.name, category: c.category, chains: c.chains,
    chain: (c.chains || [])[0] || null, tvl_usd: Math.round(c.tvl),
    tvl_change_1d_pct: c.change_1d, tvl_change_7d_pct: c.change_7d, audits: c.audits,
    listed_at: c.listedAt ? new Date(c.listedAt * 1000).toISOString().slice(0, 10) : null,
    description: c.description, website: cleanUrl(c.url), twitter: c.twitter, logo: c.logo,
    score: s.score, score_components: s.components, implied_value_usd: s.implied,
    implied_value_multiple: s.mult, token_status: "no_token_recorded",
    token_status_source: "DefiLlama protocols API, 2026-11-25 (no address, gecko_id, cmcId, mcap or symbol on the protocol record, and no token on its parent protocol where one exists)",
    evidence: r.evidence,
    farm_plan: [
      `Use ${c.name} on ${chains} via its official site (${cleanUrl(c.url)}) — ${verb}.`,
      "Keep the position active over time; airdrop snapshots, where a project runs one, normally reward sustained use rather than a single transaction.",
      "Watch the protocol's official X account and blog for any points programme, snapshot or token announcement; only trust links posted there.",
      "Never buy a token claiming to be this protocol's until the official site or X account publishes its contract address.",
    ],
  });
}

board.sort((a, b) => b.score - a.score || b.tvl_usd - a.tvl_usd);
const final = board.slice(0, 100);
final.forEach((r, i) => (r.rank = i + 1));
writeFileSync("data/board-rows.json", JSON.stringify(final, null, 2));
writeFileSync("data/dropped.json", JSON.stringify(stillDropped, null, 2));
console.log("revived:", revived.length, "still dropped:", stillDropped.length, "board rows:", final.length);
for (const r of final.slice(0, 12)) console.log(r.rank, r.name, "score", r.score, "implied $", (r.implied_value_usd / 1e6).toFixed(1) + "m", "tvl $", (r.tvl_usd / 1e6).toFixed(1) + "m");

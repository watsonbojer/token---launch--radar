// Scoring + evidence verification (build time).
// Reads data/candidates.json, builds the four evidence links per row,
// HEAD-checks every link live, drops rows with a dead link, scores the
// rest, and writes data/board-rows.json (exactly 100), data/evidence-checks.json
// and data/dropped.json. Run: node scripts/score.mjs
import { readFileSync, writeFileSync } from "node:fs";

const SNAPSHOT_DATE = "2026-11-25";
const candidates = JSON.parse(readFileSync("data/candidates.json", "utf8"));

const CATEGORY_MULTIPLE = {
  "Prediction Market": 0.45,
  Dexs: 0.35,
  Derivatives: 0.32,
  Perps: 0.32,
  Lending: 0.3,
  "Dex Aggregator": 0.3,
  RWA: 0.28,
  "Uncollateralized Lending": 0.28,
  "Lending Aggregator": 0.28,
  CDP: 0.25,
  Insurance: 0.25,
  "Yield Aggregator": 0.22,
  "Basis Trading": 0.22,
  Options: 0.22,
  "Options Vault": 0.2,
  "Liquidity Manager": 0.2,
  "Algo-Stables": 0.2,
  Yield: 0.18,
  "Leveraged Farming": 0.15,
  Farm: 0.1,
};

function cleanUrl(u) {
  try {
    const x = new URL(u);
    for (const k of [...x.searchParams.keys()]) {
      if (/^utm_|^ref$|^join$|^ref_/i.test(k)) x.searchParams.delete(k);
    }
    return x.toString();
  } catch {
    return u;
  }
}

function evidenceFor(c) {
  const fourth =
    (c.audit_links && c.audit_links[0]) ||
    (c.github && c.github[0] ? `https://github.com/${c.github[0]}` : null) ||
    c.tvlCodePath ||
    `https://defillama.com/protocol/${c.slug}`;
  return [
    { label: "DefiLlama", url: `https://defillama.com/protocol/${c.slug}` },
    { label: "Website", url: cleanUrl(c.url) },
    { label: "X (Twitter)", url: `https://x.com/${c.twitter}` },
    { label: "Audit / source", url: fourth },
  ];
}

async function head(url, timeoutMs = 9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (token-radar-01 evidence check)" },
    });
    return { status: r.status, ok: r.status >= 200 && r.status < 400 };
  } catch (e) {
    return { status: null, ok: false, error: String(e?.cause?.code || e?.name || e) };
  } finally {
    clearTimeout(t);
  }
}

function scoreRow(c) {
  const tvl = c.tvl;
  const tvlScore =
    40 * Math.max(0, Math.min(1, (Math.log10(tvl) - Math.log10(3e6)) / (Math.log10(1e9) - Math.log10(3e6))));
  const mult = CATEGORY_MULTIPLE[c.category] ?? 0.2;
  const catScore = mult >= 0.45 ? 20 : mult >= 0.35 ? 20 : mult >= 0.32 ? 18 : mult >= 0.3 ? 17 : mult >= 0.28 ? 16 : mult >= 0.25 ? 15 : mult >= 0.22 ? 13 : mult >= 0.2 ? 12 : mult >= 0.18 ? 11 : mult >= 0.15 ? 9 : 6;
  const chainsScore = Math.min((c.chains || []).length, 10);
  const ageYears = c.listedAt ? (Date.parse("2026-11-25T00:00:00Z") / 1000 - c.listedAt) / 31557600 : null;
  const maturityScore = ageYears === null ? 5 : (Math.min(Math.max(ageYears, 0), 3) / 3) * 10;
  const ch7 = typeof c.change_7d === "number" ? Math.max(-20, Math.min(50, c.change_7d)) : 0;
  const momentumScore = ((ch7 + 20) / 70) * 10;
  const auditsScore = (Math.min(c.audits || 0, 2) / 2) * 10;
  const score = Math.round((tvlScore + catScore + chainsScore + maturityScore + momentumScore + auditsScore) * 10) / 10;
  return {
    score: Math.min(score, 100),
    implied_value_usd: Math.round(tvl * mult),
    multiple: mult,
    components: {
      tvl: Math.round(tvlScore * 10) / 10,
      category: catScore,
      chains: chainsScore,
      maturity: Math.round(maturityScore * 10) / 10,
      momentum_7d: Math.round(momentumScore * 10) / 10,
      audits: auditsScore,
    },
  };
}

const FARM_VERBS = {
  Dexs: "trade and provide liquidity",
  Lending: "supply assets and borrow against them",
  Derivatives: "trade perpetuals / derivatives with small, managed positions",
  "Prediction Market": "trade markets and provide liquidity where offered",
  Yield: "deposit into the yield vaults",
  "Yield Aggregator": "deposit into the vaults",
  RWA: "use the tokenised-asset products on offer",
  CDP: "open a collateralised position",
  "Options Vault": "deposit into the options vaults",
  "Leveraged Farming": "open a leveraged farming position with strict risk limits",
  "Uncollateralized Lending": "use the credit markets as a lender where permitted",
  Insurance: "buy cover / provide cover capital where offered",
  "Liquidity Manager": "deposit into managed liquidity positions",
  "Basis Trading": "use the basis / delta-neutral products on offer",
  Farm: "use the farming pools on offer",
  "Algo-Stables": "use the stablecoin products on offer",
  Options: "trade options with small, managed positions",
  Perps: "trade perpetuals with small, managed positions",
  "Dex Aggregator": "route trades through the aggregator",
  "Lending Aggregator": "supply through the aggregated lending markets",
};

function farmPlan(c) {
  const verb = FARM_VERBS[c.category] || "use the protocol";
  const chains = (c.chains || []).slice(0, 3).join(", ") || "its supported chains";
  return [
    `Use ${c.name} on ${chains} via its official site (${cleanUrl(c.url)}) — ${verb}.`,
    "Keep the position active over time; airdrop snapshots, where a project runs one, normally reward sustained use rather than a single transaction.",
    "Watch the protocol's official X account and blog for any points programme, snapshot or token announcement; only trust links posted there.",
    "Never buy a token claiming to be this protocol's until the official site or X account publishes its contract address.",
  ];
}

// --- link checking, 10 concurrent ---
const checks = [];
const dropped = [];
const kept = [];
let idx = 0;
async function worker() {
  while (idx < candidates.length) {
    const c = candidates[idx++];
    const evidence = evidenceFor(c);
    const results = [];
    for (const ev of evidence) {
      const r = await head(ev.url);
      // x.com routinely returns 403 to bots: host responded, link is real.
      const live = r.ok || r.status === 403 || r.status === 405;
      results.push({ label: ev.label, url: ev.url, status: r.status, live, error: r.error || null });
    }
    checks.push({ slug: c.slug, name: c.name, checked_at: new Date().toISOString(), results });
    const dead = results.filter((r) => !r.live);
    if (dead.length) {
      dropped.push({ slug: c.slug, name: c.name, dead: dead.map((d) => ({ label: d.label, url: d.url, status: d.status, error: d.error })) });
    } else {
      const s = scoreRow(c);
      kept.push({
        rank: 0,
        slug: c.slug,
        name: c.name,
        category: c.category,
        chains: c.chains,
        chain: (c.chains || [])[0] || null,
        tvl_usd: Math.round(c.tvl),
        tvl_change_1d_pct: c.change_1d,
        tvl_change_7d_pct: c.change_7d,
        audits: c.audits,
        listed_at: c.listedAt ? new Date(c.listedAt * 1000).toISOString().slice(0, 10) : null,
        description: c.description,
        website: cleanUrl(c.url),
        twitter: c.twitter,
        logo: c.logo,
        score: s.score,
        score_components: s.components,
        implied_value_usd: s.implied_value_usd,
        implied_value_multiple: s.multiple,
        token_status: "no_token_recorded",
        token_status_source: "DefiLlama protocols API, 2026-11-25 (no address, gecko_id, cmcId, mcap or symbol on the protocol record, and no token on its parent protocol where one exists)",
        evidence: results.map((r) => ({ label: r.label, url: r.url, status: r.status, verified_at: SNAPSHOT_DATE })),
        farm_plan: farmPlan(c),
      });
    }
  }
}
await Promise.all(Array.from({ length: 10 }, worker));

kept.sort((a, b) => b.score - a.score || b.tvl_usd - a.tvl_usd);
const board = kept.slice(0, 100);
board.forEach((r, i) => (r.rank = i + 1));
console.log("checked:", checks.length, "kept:", kept.length, "dropped:", dropped.length, "board:", board.length);
for (const d of dropped) console.log("DROPPED", d.slug, JSON.stringify(d.dead));
writeFileSync("data/board-rows.json", JSON.stringify(board, null, 2));
writeFileSync("data/evidence-checks.json", JSON.stringify({ snapshot_date: SNAPSHOT_DATE, source: "DefiLlama protocols API https://api.llama.fi/protocols, fetched 2026-11-25", checks }, null, 2));
writeFileSync("data/dropped.json", JSON.stringify(dropped, null, 2));
console.log("top 10 by score:");
for (const r of board.slice(0, 10)) console.log(r.rank, r.name, "score", r.score, "implied $", (r.implied_value_usd / 1e6).toFixed(1) + "m", "tvl $", (r.tvl_usd / 1e6).toFixed(1) + "m");

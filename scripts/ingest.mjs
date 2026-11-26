// Ingest step v2 — stricter, launch-plausibility filter.
// A row only qualifies if it is a real DeFi protocol (not a bridge,
// wrapper, stablecoin, staked product, curator/vault manager, CEX or
// chain) whose DefiLlama record shows NO token (no address, no
// gecko/cmc id, no mcap, no symbol) AND whose parent protocol (if any)
// also shows no token. Source: data/defillama-protocols-raw.json
// (DefiLlama public API, fetched 2026-11-25).
import { readFileSync, writeFileSync } from "node:fs";

const raw = JSON.parse(readFileSync("data/defillama-protocols-raw.json", "utf8"));
const bySlug = new Map(raw.map((p) => [p.slug, p]));

function hasToken(p) {
  if (!p) return false;
  if (p.address) return true;
  if (p.gecko_id) return true;
  if (p.cmcId) return true;
  if (typeof p.mcap === "number" && p.mcap > 0) return true;
  if (p.symbol && p.symbol !== "-") return true;
  return false;
}

// Categories that are protocols which could plausibly launch a token.
const KEEP_CATEGORIES = new Set([
  "Dexs",
  "Lending",
  "Derivatives",
  "Prediction Market",
  "Yield",
  "Yield Aggregator",
  "RWA",
  "CDP",
  "Options Vault",
  "Leveraged Farming",
  "Uncollateralized Lending",
  "Insurance",
  "Liquidity Manager",
  "Basis Trading",
  "Algo-Stables",
  "Farm",
  "Options",
  "Perps",
  "Dex Aggregator",
  "Lending Aggregator",
]);

const NAME_BAD =
  /wrapped|staked|wbtc|sbtc|xbtc|kbtc|fbtc|gtbtc|ybtc|usdt0|\busdd\b|usdcx|avusd|aveth|thusd|thbill|yusd|usddw|wtao|\bbtc\b|bridge|restak|lst\b/i;

const eligible = [];
// Manual exclusions, each verified against a traded token or a
// non-launch product (see METHODOLOGY.md). DefiLlama's token fields
// alone are not enough: e.g. Noon's $NOON trades on KuCoin since
// 5 Mar 2026 although its DefiLlama record lists no token.
const BLOCKLIST = new Map([
  ["bittensor-dtao", "TAO trades"],
  ["gmx-solana", "GMX trades"],
  ["apex-omni", "APEX trades"],
  ["bouncebit-prime", "BB trades"],
  ["kava-mint", "KAVA trades"],
  ["zircuit-staking", "staking product, not a launch"],
  ["katana-pre-launch", "chain pre-launch farm, not a protocol launch"],
  ["katana-dex", "KAT (Katana chain token) trades"],
  ["btcfi-cdp", "BTC-backed product"],
  ["narausd", "NaraUSD stablecoin"],
  ["flying-tulip-ftusd", "ftUSD stablecoin"],
  ["swan-dao", "swanUSD stablecoin"],
  ["stargate", "VeChain StarGate; VET/VTHO trade"],
  ["tempo-stablecoin-dex", "Tempo chain product"],
  ["xrpl-dex", "XRP trades (chain DEX)"],
  ["stellar-dex", "XLM trades (chain DEX)"],
  ["stellar-amm", "XLM trades (chain DEX)"],
  ["stellar-defi-hub", "XLM trades (chain product)"],
  ["verus-market", "VRSC trades"],
  ["noon", "$NOON launched; trading on KuCoin since 5 Mar 2026"],
]);
for (const p of raw) {
  if (!p || typeof p.tvl !== "number" || p.tvl < 3_000_000) continue;
  if (!p.slug || !p.name || !p.url || !p.twitter) continue;
  if (!KEEP_CATEGORIES.has(p.category)) continue;
  if (NAME_BAD.test(p.name) || NAME_BAD.test(p.slug)) continue;
  if (/wrapped (bitcoin|btc|eth|sol)/i.test(p.description || "")) continue;
  if (BLOCKLIST.has(p.slug)) {
    console.log("DROP", p.slug, "-", BLOCKLIST.get(p.slug));
    continue;
  }
  if (hasToken(p)) continue;
  const parent = p.parentProtocolSlug ? bySlug.get(p.parentProtocolSlug) : null;
  if (parent && hasToken(parent)) continue;
  eligible.push(p);
}

eligible.sort((a, b) => b.tvl - a.tvl);
console.log("raw:", raw.length, "eligible:", eligible.length);
const top = eligible.slice(0, 150).map((p, i) => ({
  rank_by_tvl: i + 1,
  id: p.id,
  name: p.name,
  slug: p.slug,
  category: p.category,
  chains: p.chains || [],
  tvl: p.tvl,
  change_1d: p.change_1d ?? null,
  change_7d: p.change_7d ?? null,
  url: p.url,
  twitter: p.twitter,
  description: (p.description || "").slice(0, 300),
  audits: Number(p.audits || 0),
  listedAt: p.listedAt ?? null,
  parentProtocol: p.parentProtocol || null,
  parentProtocolSlug: p.parentProtocolSlug || null,
  audit_links: p.audit_links || [],
  github: p.github || [],
  tvlCodePath: p.tvlCodePath || null,
  logo: p.logo || null,
}));
writeFileSync("data/candidates.json", JSON.stringify(top, null, 2));
for (const c of top) {
  console.log(
    String(c.rank_by_tvl).padStart(3),
    c.name.padEnd(28),
    (c.category || "?").padEnd(16),
    "TVL $" + Math.round(c.tvl / 1e6) + "m",
    "chains:" + c.chains.length,
    "audits:" + c.audits,
    c.url,
  );
}

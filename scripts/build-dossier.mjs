// Build data/dossier.json: the top 10 board rows by score, plus
// Extended Perps (rank 19) as an 11th entry because its token launch is
// confirmed and dated (XTEN TGE, 30 Nov 2026).
// Sourced notes are written out in full below; anything not in NOTES is
// taken only from the DefiLlama record and is labelled as such.
// Run: node scripts/build-dossier.mjs
import { readFileSync, writeFileSync } from "node:fs";

const board = JSON.parse(readFileSync("data/board-rows.json", "utf8"));

const NOTES = {
  "polymarket-international": {
    overview:
      "The world's largest prediction market. Users trade shares in event outcomes (politics, sport, culture, crypto) with USDC-backed collateral; Polymarket also runs a CFTC-regulated US exchange. Its value is driven by trading volume, not locked TVL, so a TVL-multiple understates it: ICE's October 2025 investment valued the company at about $8 billion pre-investment (ICE press release / SEC 8-K, 7 Oct 2025).",
    token_status_detail:
      "No token as of 16 Nov 2026. Polymarket's help center (updated 24 Jun 2026) says it 'has not announced plans for any airdrop or token generation event'. Its CMO said in Oct 2025 'there will be a token, there will be an airdrop'; parent Blockratize Inc. filed intent-to-use US trademarks for POLY and $POLY on 4 Feb 2026; Bloomberg reported on 13 Oct 2026 that the company is weighing a token against an IPO, with no decision. No ticker, supply, snapshot date or contract address exists.",
    token_status_sources: [
      { label: "ICE press release / SEC 8-K, 7 Oct 2025 — ~$8bn valuation", url: "https://www.sec.gov/Archives/edgar/data/1571949/000094787125000890/ss5432176_ex9901.htm" },
      { label: "Status round-up, 16 Nov 2026 (quotes the help center article of 24 Jun 2026)", url: "https://blockchainreporter.net/polymarket-pre-token-airdrop-activity-strategy/" },
      { label: "Polymarket official site", url: "https://polymarket.com" },
    ],
    why_it_ranks:
      "Largest TVL on the board among prediction markets, two audits, multi-year track record, and a token that its own executives have said is coming — the single highest-value launch candidate by any measure except a TVL multiple, which understates volume-driven businesses.",
    farm_plan: [
      "Trade markets on polymarket.com (Polygon; US users use the regulated US app) — sustained, genuine trading volume is what past prediction-market distributions have rewarded, and Polymarket has published no eligibility rules, so there is no shortcut to buy.",
      "Provide liquidity where Polymarket offers it; liquidity rewards are currently paid in pUSD, its USDC-backed collateral token.",
      "Do not buy any token calling itself POLY: Polymarket has announced no contract address, and its help center warns that claim sites are scams. The POLY ticker already belongs to an unrelated older token (Polymath).",
      "Watch polymarket.com and its official X account only; a token, if announced, will come through official channels.",
    ],
    risks: [
      "Polymarket may choose an IPO instead of a token (Bloomberg, Oct 2026) — a token is hinted, not committed.",
      "No published snapshot or eligibility rules: farming spend may not be rewarded at all.",
      "US regulatory exposure: the US business is a separate CFTC-regulated exchange.",
    ],
  },
  tydro: {
    overview:
      "A lending protocol on Ink (the Kraken-backed L2), built as an Aave v3 white-label. It is the largest TVL protocol on the board with no token of its own. Users earn INK — the Ink chain token, which already trades — plus Tydro points.",
    token_status_detail:
      "No Tydro token exists. DefiLlama lists no token for Tydro, and its rewards are paid in INK (the Ink chain's token) and points. A Tydro-native token would therefore be a separate, future event from the INK rewards already live — the board ranks the hypothetical Tydro token, not the INK already being distributed.",
    token_status_sources: [
      { label: "DefiLlama protocol page", url: "https://defillama.com/protocol/tydro" },
      { label: "Tydro official site", url: "https://tydro.com/" },
    ],
    why_it_ranks:
      "Largest TVL on the board ($392m) in a category (lending) where listed peers trade at 0.2–0.4× TVL, giving the highest TVL-multiple implied value of any row — with the caveat that its rewards already flow in an existing token (INK).",
    farm_plan: [
      "Supply assets and borrow on tydro.com (Ink chain) — lending activity is the core usage the protocol rewards with points.",
      "Track the Tydro points programme and INK rewards in the app; points are the most likely basis for any future Tydro distribution.",
      "Watch Tydro's official X account for any token or snapshot announcement; only trust links posted there.",
      "Never buy a token claiming to be Tydro's until the official site publishes its contract address.",
    ],
    risks: [
      "Rewards already flow in INK, which trades — a Tydro token may never come, and the points programme may simply keep paying INK.",
      "TVL is concentrated on a single chain (Ink).",
      "Tydro had a reported security incident in May 2026 that halted markets; check the current status of its markets before depositing.",
    ],
  },
  "extended-perps": {
    overview:
      "A self-custody perpetuals DEX (formerly X10), built by ex-Revolut crypto staff. Settlement moved from Starknet to Circle's Arc chain on 22 Oct 2026. It runs a points programme (Xpoints) and its token launch is confirmed and dated — the most imminent launch on the board.",
    token_status_detail:
      "Pre-TGE: $XTEN was unveiled on 23 Oct 2026 as the native token, with a 1,000,000,000 max supply and 30% (300m XTEN) allocated to eligible Points participants. The allocation checker opened on 11 Nov 2026. TGE is set for 30 Nov 2026; eligible users must sign the Community Distribution Terms in the Extended app by 31 Dec 2026, and users who sign before TGE receive tokens in the first transfer batch. Pre-market venues priced XTEN around $0.26 in late Oct 2026 on thin (<$1m) open interest — an indication only.",
    token_status_sources: [
      { label: "TGE Index — Extended (XTEN) TGE, checked 23 Nov 2026", url: "https://tgeindex.com/tge/extended/" },
      { label: "CoinLaunch — Extended Exchange token details", url: "https://coinlaunch.space/projects/extended-exchange/" },
    ],
    why_it_ranks:
      "Not the top score — the confirmed, dated TGE (30 Nov 2026) makes it the most actionable launch on the board: the launch is a scheduled event, not a rumour, and the distribution mechanics (30% to points holders, first batch for pre-TGE signers) are published.",
    farm_plan: [
      "Open the Extended app (app.extended.exchange) and sign the Community Distribution Terms before the 30 Nov 2026 TGE to be in the first transfer batch; unsigned allocations go to the Ecosystem Fund after 31 Dec 2026.",
      "Check your XTEN allocation in the checker that opened on 11 Nov 2026 — if you farmed Xpoints, your allocation is already fixed; late trading cannot retroactively earn this distribution.",
      "Trade perps on Extended with small, managed positions if you want exposure to future seasons; do not chase the pre-market XTEN price on thin venues.",
      "Claim only inside the Extended app, which never asks for a seed phrase.",
    ],
    risks: [
      "The points snapshot for this distribution has effectively already happened (checker open since 11 Nov 2026) — new users are likely too late for the 30% community allocation.",
      "Pre-market pricing (~$0.26) is thin and indicative, not a launch price; the first transfer batch will include farmer selling.",
      "Settlement chain changed in Oct 2026 (Starknet to Arc); verify which chain your funds and positions are on.",
    ],
  },
};

const GENERIC = {
  token_status_detail:
    "No token recorded: the DefiLlama protocol record for this protocol (fetched 25 Nov 2026) lists no token address, no CoinGecko id, no CoinMarketCap id, no market cap and no symbol, and its parent protocol (where one exists) also lists no token. No token announcement was verified for this entry beyond that record — check the protocol's official X account and blog before acting.",
  why_it_ranks: "High TVL in its category with no token recorded, giving a large TVL-multiple implied launch value.",
  risks: [
    "No token announcement has been verified — the protocol may never launch a token.",
    "Implied value is an estimate from a TVL multiple, not a market price; the real launch value depends on tokenomics, float and market conditions at TGE.",
  ],
};

const picks = [...board.slice(0, 10), board.find((r) => r.slug === "extended-perps")].filter(Boolean);
const seen = new Set();
const dossier = picks.filter((r) => !seen.has(r.slug) && seen.add(r.slug)).map((r) => {
  const n = NOTES[r.slug] || {};
  return {
    rank: r.rank,
    slug: r.slug,
    name: r.name,
    category: r.category,
    chains: r.chains,
    tvl_usd: r.tvl_usd,
    tvl_change_7d_pct: r.tvl_change_7d_pct,
    audits: r.audits,
    listed_at: r.listed_at,
    score: r.score,
    implied_value_usd: r.implied_value_usd,
    implied_value_multiple: r.implied_value_multiple,
    overview: n.overview || (r.description || "No description in the DefiLlama record."),
    token_status: "no_token_recorded",
    token_status_detail: n.token_status_detail || GENERIC.token_status_detail,
    token_status_sources: n.token_status_sources || [
      { label: "DefiLlama protocol page", url: `https://defillama.com/protocol/${r.slug}` },
      { label: "Official website", url: r.website },
    ],
    why_it_ranks: n.why_it_ranks || GENERIC.why_it_ranks,
    farm_plan: n.farm_plan || r.farm_plan,
    risks: n.risks || GENERIC.risks,
    evidence: r.evidence,
  };
});

writeFileSync(
  "data/dossier.json",
  JSON.stringify({ snapshot_date: "2026-11-25", count: dossier.length, note: "Top 10 board rows by score, plus Extended Perps (rank 19) — its XTEN TGE is confirmed for 30 Nov 2026.", launches: dossier }, null, 2)
);
console.log("dossier launches:", dossier.length);
for (const d of dossier) console.log(d.rank, d.name, "score", d.score, "implied $", (d.implied_value_usd / 1e6).toFixed(1) + "m");

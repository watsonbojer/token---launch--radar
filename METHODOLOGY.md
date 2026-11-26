# Methodology — Token Launch Radar

Snapshot date: **25 Nov 2026**. All figures are from that day unless a source
says otherwise.

## 1. Universe

Source: the DefiLlama public protocols API, `https://api.llama.fi/protocols`,
fetched 25 Nov 2026 — **9,110 protocols** (`data/defillama-protocols-raw.json`).

## 2. "Still records no token"

A protocol counts as tokenless only if **all** of these hold on its DefiLlama
record:

- no token `address`, no `gecko_id`, no `cmcId`, no `mcap`, and no `symbol`
  (a `symbol` of `"-"` is treated as no symbol);
- if it has a `parentProtocol`, the parent's record also shows no token.

That rule alone is not enough, so every candidate that survived the filters
was checked against a manual blocklist (see `scripts/ingest.mjs`), and the
top rows were spot-checked by web search. Two catches this produced:

- **Noon** — DefiLlama lists no token for it, but **$NOON launched in Q2
  2025 and trades on KuCoin (listed 5 Mar 2026)**. Excluded.
- **Bittensor dTAO, GMX Solana, Apex Omni, BounceBit Prime, Kava Mint,
  Katana DEX** — the parent token already trades. Excluded, along with
  stablecoin products (NaraUSD, ftUSD, swanUSD), chain products (XRPL/ Stellar
  DEXes, Tempo, StarGate on VeChain) and staking products (Zircuit Staking).

Spot-checks that confirmed rows as genuinely tokenless:

- **Polymarket** — no token as of 16 Nov 2026; help center (24 Jun 2026) says
  no airdrop or token generation event has been announced.
- **Tydro** — no token of its own; users earn INK (the Ink chain token, which
  already trades) plus Tydro points.
- **Extended Perps** — no token trading yet; $XTEN TGE is set for 30 Nov 2026.

## 3. Filters

- TVL ≥ $3m
- category in: Dexs, Lending, Derivatives, Prediction Market, Yield, Yield
  Aggregator, RWA, CDP, Options Vault, Leveraged Farming, Uncollateralized
  Lending, Insurance, Liquidity Manager, Basis Trading, Algo-Stables, Farm,
  Options, Perps, Dex Aggregator, Lending Aggregator
- a website and an X (Twitter) handle on the record
- name/slug does not contain wrapped, staked, bridge, BTC, stablecoin or
  restaking markers
- not a centralised exchange or liquid-staking product

Result: **111 eligible protocols**. After evidence-link checks (below),
**100 rows** made the board; 8 were dropped for dead links and are listed in
`data/dropped.json`.

## 4. Scoring (0–100)

| Component | Max | How it is computed |
| --- | --- | --- |
| TVL | 40 | `40 × (log10(TVL) − log10($3m)) / (log10($1bn) − log10($3m))`, clamped 0–40 |
| Category | 20 | From the implied-value multiple: ≥0.45 → 20, 0.35 → 20, 0.32 → 18, 0.30 → 17, 0.28 → 16, 0.25 → 15, 0.22 → 13, 0.20 → 12, 0.18 → 11, 0.15 → 9, else 6 |
| Chains | 10 | `min(number of chains, 10)` |
| Maturity | 10 | Years since the protocol was listed on DefiLlama, capped at 3 years → 10; 5 if no listing date |
| 7-day momentum | 10 | 7-day TVL change clamped to −20…+50%, scaled to 0–10 |
| Audits | 10 | `min(audits, 2) / 2 × 10` |

## 5. Implied launch value

`implied_value_usd = TVL × category multiple`, where the multiple is a rough
mid-range FDV/TVL for listed peers in the category:

Prediction Market 0.45 · Dexs 0.35 · Derivatives/Perps 0.32 · Lending and Dex
Aggregator 0.30 · RWA, Uncollateralized Lending, Lending Aggregator 0.28 ·
CDP, Insurance 0.25 · Yield Aggregator, Basis Trading, Options 0.22 ·
Options Vault, Liquidity Manager, Algo-Stables 0.20 · Yield 0.18 ·
Leveraged Farming 0.15 · Farm 0.10.

This is an **estimate, not a price**. It systematically understates
volume-driven businesses: Polymarket's TVL-multiple value here is $144.5m,
while ICE's October 2025 investment valued the company at about $8bn
pre-investment (ICE press release / SEC 8-K, 7 Oct 2025) — prediction-market
value lives in volume, not locked TVL. The dossier says so on the Polymarket
entry instead of hiding it.

## 6. Evidence — four links per row, checked live

Every board row carries four links:

1. its DefiLlama protocol page,
2. its official website (tracking/referral query parameters stripped),
3. its X account,
4. its first audit link, or its GitHub repo, or the DefiLlama adapter file
   that reports its TVL (labelled "TVL source (DefiLlama adapter)" in that
   case — 52 rows).

All **400 links were HEAD-checked live** at build time
(`scripts/score.mjs`, then `scripts/recheck.mjs` re-checked every dropped
row with GET and retries). `x.com` returns 403 to bots and DefiLlama
occasionally returns 403 to HEAD requests; a 403/405 from a host that
responded is counted as "host live, link real", with the status recorded.
Rows with a genuinely dead link (404, 429/504 after retries, socket failure
after retries) were dropped: 40-acres, hyperbeat-earn, reya-perps, bend,
agni-finance, nawa-protocol, hypurrfi-pooled, toros.

`main.ts` re-checks the links at run time when a network is available and
records the result in `evidence-check-runtime.json`; with no network it
records that the check was skipped and the build-time record stands.

## 7. Farm plans

Each row has a four-step plan. The steps are category templates filled with
the protocol's name, chains and official site — they describe real usage
(trade, supply, deposit, provide liquidity) and tell the reader to trust
only the protocol's official channels and never to buy an unofficial token.
Where a points programme, snapshot or launch date is publicly documented,
the dossier entry states it with sources (Polymarket hints, Tydro INK +
points, Extended $XTEN TGE 30 Nov 2026). No points programme, snapshot or
date is invented for any other protocol.

## 8. Dossier

The top 10 board rows by score, plus Extended Perps (rank 19) because its
token launch is confirmed and dated — 11 launches in total. Each entry has
an overview, token status with sources, why it ranks, a farm plan, risks and
the same four evidence links.

## 9. Reproducibility

```
node scripts/ingest.mjs        # DefiLlama snapshot -> data/candidates.json (111 rows)
node scripts/score.mjs         # evidence HEAD checks + scoring -> data/board-rows.json
node scripts/recheck.mjs       # GET retries for dropped rows
node scripts/build-dossier.mjs # data/dossier.json (11 launches)
node scripts/build-outputs.mjs # board.json + dossier.json at repo root
node main.ts --generate-only   # writes board.json/dossier.json/makefun-run.json to ./output
node main.ts                   # same, then serves the dashboard on :3000
```

The snapshot file `data/defillama-protocols-raw.json` is committed, so the
ingest step can be re-run from the same data. Re-running the live checks on
a later date will give different statuses as links change — that is expected
and is why every check is timestamped.

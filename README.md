# Token Launch Radar

[![make.fun](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01)
[![make.fun rank](https://make.fun/badge/token-radar-01/watsonbojer/token---launch--radar/rank.svg)](https://make.fun/bounty/token-radar-01)
[![make.fun reward](https://make.fun/badge/token-radar-01/watsonbojer/token---launch--radar/reward.svg)](https://make.fun/bounty/token-radar-01)

Entry for the make.fun bounty **[Build the best token launch radar](https://make.fun/bounty/token-radar-01)** ($1,325 total, entries close 14 Dec 2026).

**What it is:** a web dashboard ranking the 100 DeFi protocols that still
record no token, by what their launch would be worth — with a detail view
for every protocol and a dossier of the 11 launches that matter most.

## Headline numbers (snapshot 25 Nov 2026)

- **100 protocols** on the board, from 9,110 tracked by DefiLlama
- **$3.99bn** combined TVL · **$1.12bn** combined implied launch value
- **400 evidence links**, every one checked live at build time
- **#1: Polymarket** — score 76.4, no token as of Nov 2026, ~$8bn company
  valuation (ICE, Oct 2025)
- **Most imminent: Extended Perps** — $XTEN TGE confirmed for 30 Nov 2026

## Run it

```bash
node main.ts            # generates outputs, serves the dashboard on http://localhost:3000
node main.ts --generate-only   # just writes board.json / dossier.json / makefun-run.json to ./output
```

Requires Node.js 22.18+. No network needed at run time, no install step:
`main.ts` is plain JavaScript in a `.ts` file and the dashboard has no
external dependencies.

## Files

| File | What it is |
| --- | --- |
| `main.ts` | Entry point: verifies the data, writes outputs, serves the dashboard, re-checks evidence links when a network is available |
| `board.json` | The board: 100 rows, each with score, implied value, farm plan and 4 evidence links |
| `dossier.json` | The dossier: 11 launches (top 10 by score + Extended Perps) |
| `public/` | The dashboard (board, detail view, dossier view) |
| `METHODOLOGY.md` | How the board was built, scored and verified — including what was excluded and why |
| `data/` | The DefiLlama snapshot, candidates, evidence-check records and dropped-row log |
| `scripts/` | The build pipeline (ingest → score → recheck → dossier → outputs) |
| `screenshots/` | Board, board-detail and dossier screenshots (Puppeteer) |
| `transcripts/` | Build-session notes |

## How the board was built

1. **Universe:** all 9,110 protocols in the DefiLlama API (25 Nov 2026).
2. **Tokenless:** no token address, CoinGecko id, CoinMarketCap id, market
   cap or symbol — on the protocol *and* its parent. Then a manual
   blocklist and spot-checks: this caught **Noon** ($NOON has traded on
   KuCoin since Mar 2026 despite a tokenless DefiLlama record) and several
   parent-token cases.
3. **Scored 0–100:** TVL 40 + category 20 + chains 10 + maturity 10 +
   7-day momentum 10 + audits 10. Implied value = TVL × a category
   multiple from listed peers (see `METHODOLOGY.md` — the multiples are
   estimates, and the Polymarket entry says plainly where they understate
   value).
4. **Verified:** all 400 evidence links HEAD/GET-checked live; 8 rows
   dropped for dead links (listed in `data/dropped.json`).

## Caveats

- Token status is a snapshot: a protocol can announce a token the day
  after. The dossier flags the three entries whose status was verified
  beyond DefiLlama (Polymarket, Tydro, Extended) and says so for the rest.
- Implied values are estimates, not prices.
- Not investment advice. Verify everything on each protocol's official
  channels before acting — and never buy a token until the official site
  publishes its contract address.

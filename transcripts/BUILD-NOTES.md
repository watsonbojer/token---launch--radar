# Build session notes (loose transcripts)

Built 2026-11-25 by a Muse agent session for the make.fun bounty
"Build the best token launch radar" (token-radar-01), entrant @blockchaineth,
GitHub account Watsonbojer. Nothing was submitted, sponsored or spent in
this session; no sign-in to make.fun or GitHub took place; the make.fun kit
was NOT downloaded, installed or run (its skill file did not pass a safety
check), so no kit bundle exists — these notes are the loose transcript
record instead.

## What was done, in order

1. Read the bounty requirements API
   (https://make.fun/api/competitions/token-radar-01/requirements) and the
   bounty page in full.
2. Fetched the DefiLlama public protocols API (9,110 protocols, 9.7 MB) to
   data/defillama-protocols-raw.json.
3. First filter pass was rejected: the top list was dominated by wrapped /
   bridge products (WBTC, USDT0, canonical bridges), which are not
   plausible token launches.
4. Second filter pass (category whitelist, TVL >= $3m, name exclusions,
   parent-protocol token check) gave 131 eligible; a manual blocklist
   removed 20 more (parent tokens trading, stablecoins, chain products).
5. Spot-checks by web search, 2026-11-25:
   - Noon: $NOON launched Q2 2025, trading on KuCoin since 5 Mar 2026 —
     excluded despite a tokenless DefiLlama record.
   - Tydro: no own token; rewards in INK (Ink chain token) + points.
   - Polymarket: no token as of 16 Nov 2026 (help center, 24 Jun 2026);
     CMO Oct 2025 "there will be a token, there will be an airdrop";
     POLY/$POLY trademarks filed 4 Feb 2026; Bloomberg 13 Oct 2026:
     weighing token vs IPO; ICE Oct 2025 investment at ~$8bn valuation
     (ICE press release / SEC 8-K).
   - Extended Perps: $XTEN TGE set for 30 Nov 2026; 1B max supply, 30%
     to Points participants; allocation checker opened 11 Nov 2026;
     sign Community Distribution Terms in-app by 31 Dec 2026.
6. Evidence checks: all 400 links HEAD-checked live; dropped rows
   re-checked with GET + retries (scripts/recheck.mjs). 8 rows dropped
   for dead links (data/dropped.json).
7. Scoring (METHODOLOGY.md), dossier (top 10 by score + Extended Perps),
   dashboard (public/), main.ts, README, screenshots (Puppeteer).

## Environment

- Node v24.22.1, npm 10.9.4, Python 3.12.3
- No Chromium pre-installed; Puppeteer + Chrome installed via npm for
  screenshots only (scripts/screenshots.mjs).
- make.fun kit: NOT used (safety check failed on the skill file).

## Open items / gaps

- .makefun/owner.json NOT added: the wallet address for @blockchaineth
  is unknown and must not be invented. Needed only if the repo owner
  differs from the account's GitHub login.
- GitHub repo not yet created/pushed; entry not submitted. Next steps
  are in the final handoff report.
- Token status is a 25 Nov 2026 snapshot; a protocol may announce a
  token after that date. The dossier says which entries were verified
  beyond DefiLlama and which were not.
- Handed-over sessions: the requirements API notes handed-over sessions
  are ranked where they score but take no paid place
  (handed_over_places: "none"). This entry was built in a handed-over
  session, so the parent agent should confirm whether that affects
  eligibility for paid places before submitting.

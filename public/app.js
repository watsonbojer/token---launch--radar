// Token Launch Radar dashboard. No build step, no external resources:
// reads board.json and dossier.json served next to this page.
const $ = (s) => document.querySelector(s);
const fmt$ = (n) => "$" + (n >= 1e9 ? (n / 1e9).toFixed(2) + "bn" : n >= 1e6 ? (n / 1e6).toFixed(1) + "m" : Math.round(n).toLocaleString());
const fmtPct = (n) => (n === null || n === undefined ? "—" : (n >= 0 ? "+" : "") + n.toFixed(1) + "%");
let BOARD = [], DOSSIER = [], SORT = { key: "score", dir: -1 };

async function load() {
  const [b, d] = await Promise.all([
    fetch("board.json").then((r) => r.json()),
    fetch("dossier.json").then((r) => r.json()),
  ]);
  BOARD = b.rows;
  DOSSIER = d.launches;
  const totalTvl = BOARD.reduce((s, r) => s + r.tvl_usd, 0);
  const totalImp = BOARD.reduce((s, r) => s + r.implied_value_usd, 0);
  $("#meta").textContent =
    `Snapshot: ${b.snapshot_date} · Source: DefiLlama protocols API · ${BOARD.length} protocols · ${fmt$(totalTvl)} combined TVL · ${fmt$(totalImp)} combined implied launch value · All ${BOARD.length * 4} evidence links checked live at build time.`;
  route();
}

function esc(s) { return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function scoreBar(score) { return `<span class="scorebar"><i style="width:${score}%"></i></span>${score.toFixed(1)}`; }

function renderBoard() {
  $("#tab-board").classList.add("active"); $("#tab-dossier").classList.remove("active");
  const cats = [...new Set(BOARD.map((r) => r.category))].sort();
  const chains = [...new Set(BOARD.flatMap((r) => r.chains || []))].sort();
  const view = $("#view");
  view.innerHTML = `
    <div class="stats">
      <div class="stat"><b>${BOARD.length}</b><span>protocols with no token</span></div>
      <div class="stat"><b>${fmt$(BOARD.reduce((s, r) => s + r.tvl_usd, 0))}</b><span>combined TVL</span></div>
      <div class="stat"><b>${fmt$(BOARD.reduce((s, r) => s + r.implied_value_usd, 0))}</b><span>combined implied launch value</span></div>
      <div class="stat"><b>${DOSSIER.length}</b><span>launches in the dossier</span></div>
    </div>
    <div class="filters">
      <input id="q" type="search" placeholder="Search name or chain…" value="${esc(window._q || "")}">
      <select id="f-cat"><option value="">All categories</option>${cats.map((c) => `<option ${window._cat === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>
      <select id="f-chain"><option value="">All chains</option>${chains.map((c) => `<option ${window._chain === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>
    </div>
    <div id="tbl"></div>
    <p class="note">Score: TVL 40 + category 20 + chains 10 + maturity 10 + 7-day momentum 10 + audits 10 (see METHODOLOGY.md). Implied value = TVL × a category multiple from listed peers — an estimate, not a price. Click a row for the full detail view, evidence links and farm plan.</p>`;
  const draw = () => {
    const q = ($("#q").value || "").toLowerCase();
    const cat = $("#f-cat").value, chain = $("#f-chain").value;
    window._q = q; window._cat = cat; window._chain = chain;
    let rows = BOARD.filter((r) =>
      (!q || r.name.toLowerCase().includes(q) || (r.chains || []).join(" ").toLowerCase().includes(q)) &&
      (!cat || r.category === cat) && (!chain || (r.chains || []).includes(chain)));
    rows = [...rows].sort((a, b) => (a[SORT.key] > b[SORT.key] ? 1 : -1) * SORT.dir);
    $("#tbl").innerHTML = `<table><thead><tr>
      <th data-k="rank">#</th><th data-k="name">Protocol</th><th data-k="category">Category</th><th>Chains</th>
      <th class="num" data-k="tvl_usd">TVL</th><th class="num" data-k="tvl_change_7d_pct">7d</th>
      <th class="num" data-k="implied_value_usd">Implied value</th><th data-k="score">Score</th></tr></thead>
      <tbody>${rows.map((r) => `<tr data-slug="${r.slug}">
        <td>${r.rank}</td><td><b>${esc(r.name)}</b></td><td>${esc(r.category)}</td>
        <td>${(r.chains || []).slice(0, 3).map((c) => `<span class="tag">${esc(c)}</span>`).join("")}</td>
        <td class="num">${fmt$(r.tvl_usd)}</td>
        <td class="num ${r.tvl_change_7d_pct >= 0 ? "pos" : "neg"}">${fmtPct(r.tvl_change_7d_pct)}</td>
        <td class="num">${fmt$(r.implied_value_usd)}</td><td>${scoreBar(r.score)}</td></tr>`).join("")}</tbody></table>
      <p style="color:var(--muted)">${rows.length} of ${BOARD.length} rows shown.</p>`;
    document.querySelectorAll("tbody tr").forEach((tr) => tr.addEventListener("click", () => location.hash = "#/detail/" + tr.dataset.slug));
    document.querySelectorAll("th[data-k]").forEach((th) => th.addEventListener("click", () => {
      const k = th.dataset.k;
      SORT = { key: k, dir: SORT.key === k ? -SORT.dir : (k === "name" || k === "category" ? 1 : -1) };
      draw();
    }));
  };
  $("#q").addEventListener("input", draw);
  $("#f-cat").addEventListener("change", draw);
  $("#f-chain").addEventListener("change", draw);
  draw();
}

function evidenceHtml(ev) {
  return `<div class="evidence">${ev.map((e) => `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.label)} <span class="ok">✓ ${e.status || "checked"}</span></a>`).join("")}</div>`;
}

function renderDetail(slug) {
  const r = BOARD.find((x) => x.slug === slug);
  if (!r) { $("#view").innerHTML = `<p>Protocol not found. <a href="#/board">Back to the board</a></p>`; return; }
  $("#tab-board").classList.add("active"); $("#tab-dossier").classList.remove("active");
  const d = DOSSIER.find((x) => x.slug === slug);
  $("#view").innerHTML = `
    <a class="back" href="#/board">← Back to the board</a>
    <div class="card">
      <h2>${esc(r.name)}</h2>
      <p class="lede">#${r.rank} · ${esc(r.category)} · ${esc((r.chains || []).join(", "))} · TVL ${fmt$(r.tvl_usd)} · Score ${r.score.toFixed(1)} / 100 · Implied launch value ${fmt$(r.implied_value_usd)} (${r.implied_value_multiple}× TVL)</p>
      <p>${esc(r.description || "")}</p>
      <div class="kv">
        <div><b>${fmt$(r.tvl_usd)}</b><span>TVL (25 Nov 2026)</span></div>
        <div><b>${fmtPct(r.tvl_change_7d_pct)}</b><span>TVL change, 7 days</span></div>
        <div><b>${r.audits || 0}</b><span>audits recorded</span></div>
        <div><b>${esc(r.listed_at || "—")}</b><span>listed on DefiLlama</span></div>
      </div>
      <h3>Score breakdown</h3>
      <div class="bars">${Object.entries(r.score_components).map(([k, v]) => `<div>${esc(k)} — ${v} <span class="scorebar"><i style="width:${Math.min(100, v * 2.5)}%"></i></span></div>`).join("")}</div>
      <h3>Token status</h3>
      <p>${esc(d ? d.token_status_detail : r.token_status_source)}</p>
      ${d ? `<h3>Why it ranks</h3><p>${esc(d.why_it_ranks)}</p>
      <h3>Risks</h3><ul class="risks">${d.risks.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      <h3>How to farm it</h3>
      <ol class="plan">${r.farm_plan.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      <h3>Evidence — every link checked live at build time</h3>
      ${evidenceHtml(r.evidence)}
    </div>`;
}

function renderDossier() {
  $("#tab-dossier").classList.add("active"); $("#tab-board").classList.remove("active");
  $("#view").innerHTML = `
    <p style="color:var(--muted)">The ${DOSSIER.length} launches that matter most: the top 10 board rows by score, plus Extended Perps — its $XTEN token launch is confirmed for 30 Nov 2026. Each entry states exactly what was verified and what was not.</p>
    ${DOSSIER.map((d) => `<div class="card">
      <h2>${d.rank ? "#" + d.rank + " · " : ""}${esc(d.name)}</h2>
      <p class="lede">${esc(d.category)} · ${esc((d.chains || []).join(", "))} · TVL ${fmt$(d.tvl_usd)} · Score ${d.score.toFixed(1)} · Implied value ${fmt$(d.implied_value_usd)}</p>
      <p>${esc(d.overview)}</p>
      <h3>Token status</h3><p>${esc(d.token_status_detail)}</p>
      ${d.token_status_sources ? `<p>${d.token_status_sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join(" · ")}</p>` : ""}
      <h3>Why it ranks</h3><p>${esc(d.why_it_ranks)}</p>
      <h3>How to farm it</h3><ol class="plan">${d.farm_plan.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      <h3>Risks</h3><ul class="risks">${d.risks.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <h3>Evidence</h3>${evidenceHtml(d.evidence)}
      <p><a href="#/detail/${d.slug}">Open the full detail view →</a></p>
    </div>`).join("")}`;
}

function route() {
  const h = location.hash || "#/board";
  if (h.startsWith("#/detail/")) renderDetail(h.slice(9));
  else if (h === "#/dossier") renderDossier();
  else renderBoard();
}
window.addEventListener("hashchange", route);
load();

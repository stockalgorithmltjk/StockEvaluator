/* ── Global state ── */
// Global state: loaded data and watchlist
let DB = null;
let watchlist = JSON.parse(localStorage.getItem("wl") || "[]");
let sortState = { key: "score", dir: "desc" }; // default: sort by score descending

/* ── Load data.json once ── */
// Load data.json and update UI
async function loadData() {
  try {
    const r = await fetch("data.json?_=" + Date.now());
    if (!r.ok) throw new Error();
    DB = await r.json();
    document.getElementById("last-updated").textContent =
      "Zuletzt aktualisiert: " + new Date(DB.updated).toLocaleString("de-DE");
    renderMarket(document.getElementById("market-select").value);
  } catch {
    document.getElementById("last-updated").textContent =
      "⚠️ Keine Daten – bitte GitHub Actions ausführen";
  }
}

/* ── Tabs ── */
// Tab switching logic
document.querySelectorAll("button[data-tab]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("button[data-tab]").forEach(b => b.style.textDecoration = "none");
    document.querySelectorAll("[data-pane]").forEach(p => p.style.display = "none");
    btn.style.textDecoration = "underline";
    document.querySelector(`[data-pane='${btn.dataset.tab}']`).style.display = "block";
  });
});
document.querySelector("button[data-tab='search']").style.textDecoration = "underline";
document.querySelector("[data-pane='search']").style.display = "block";

/* ── Market rankings ── */
// Market select event
document.getElementById("market-select").addEventListener("change", e => {
  sortState = { key: "score", dir: "desc" };
  renderMarket(e.target.value);
});

// Render market table for selected market
function renderMarket(marketId) {
  const tbody = document.getElementById("market-tbody");
  const meta  = document.getElementById("market-meta");
  tbody.innerHTML = "";
  if (!DB) { meta.textContent = "Daten werden geladen…"; return; }
  const market = DB.markets[marketId];
  if (!market) { meta.textContent = "Markt nicht gefunden"; return; }
  meta.textContent = market.stocks.length + " Unternehmen";

  // Pre-compute score rank (fixed, independent of current sort)
  const scoreRanked = [...market.stocks].sort((a, b) => b.score - a.score);
  const rankMap = new Map(scoreRanked.map((s, i) => [s.symbol, i + 1]));

  // Sort stocks if sortState is set
  let stocks = [...market.stocks];
  if (sortState.key) {
    stocks.sort((a, b) => {
      let va, vb;
      switch (sortState.key) {
        case "symbol": va = a.symbol; vb = b.symbol; break;
        case "name":   va = a.name;   vb = b.name;   break;
        case "price":  va = a.price ?? -Infinity; vb = b.price ?? -Infinity; break;
        case "pe":     va = a.metrics.pe  ?? (sortState.dir === 'asc' ? Infinity : -Infinity); vb = b.metrics.pe  ?? (sortState.dir === 'asc' ? Infinity : -Infinity); break;
        case "pb":     va = a.metrics.pb  ?? (sortState.dir === 'asc' ? Infinity : -Infinity); vb = b.metrics.pb  ?? (sortState.dir === 'asc' ? Infinity : -Infinity); break;
        case "roe":    va = a.metrics.roe ?? (sortState.dir === 'asc' ? Infinity : -Infinity); vb = b.metrics.roe ?? (sortState.dir === 'asc' ? Infinity : -Infinity); break;
        case "score":  va = a.score; vb = b.score; break;
        default:       return 0;
      }
      if (typeof va === 'string') return sortState.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortState.dir === 'asc' ? va - vb : vb - va;
    });
  }

  // Update header arrow highlights
  document.querySelectorAll("th.sortable").forEach(th => {
    const arrowEl = th.querySelector(".sort-arrow");
    if (th.dataset.sort === sortState.key) {
      th.classList.add("sort-active");
      arrowEl.textContent = sortState.dir === 'asc' ? '↑' : '↓';
      arrowEl.style.display = 'inline';
    } else {
      th.classList.remove("sort-active");
      arrowEl.style.display = 'none';
    }
  });

  stocks.forEach((s) => {
    const rank = rankMap.get(s.symbol);
    const priceStr = s.price != null ? s.price.toLocaleString("de-DE", {minimumFractionDigits:2,maximumFractionDigits:2}) + " " + s.currency : "–";
    const pe  = s.metrics.pe   != null ? s.metrics.pe.toFixed(1) : "–";
    const pb  = s.metrics.pb   != null ? s.metrics.pb.toFixed(2) : "–";
    const roe = s.metrics.roe  != null ? s.metrics.roe.toFixed(1) + "%" : "–";
    let scoreClass = "score-weak";
    if (s.score >= 80) scoreClass = "score-excellent";
    else if (s.score >= 60) scoreClass = "score-good";
    else if (s.score >= 40) scoreClass = "score-average";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${rank}</td>
      <td><strong>${s.symbol}</strong></td>
      <td>${s.name}</td>
      <td>${priceStr}</td>
      <td>${pe}</td>
      <td>${pb}</td>
      <td>${roe}</td>
      <td><span class="${scoreClass}">${s.score}</span></td>
    `;
    tr.addEventListener("click", () => {
      showStockFromDB(s);
      document.querySelector('[data-tab="search"]').click();
    });
    tbody.appendChild(tr);
  });
}

// Sort column click handler
document.querySelectorAll("th.sortable").forEach(th => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (sortState.key === key) {
      sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
    } else {
      sortState.key = key;
      sortState.dir = 'desc'; // always start descending on new column
    }
    renderMarket(document.getElementById("market-select").value);
  });
});

/* ── Search ── */
// Search events
document.getElementById("search-btn").addEventListener("click", doSearch);
document.getElementById("search-input").addEventListener("keydown", e => {
  if (e.key === "Enter") doSearch();
});

// Get all stocks from all markets
function getAllStocks() {
  if (!DB) return [];
  return Object.values(DB.markets).flatMap(m => m.stocks);
}

// Search for stock by symbol or name
function doSearch() {
  const raw = document.getElementById("search-input").value.trim();
  const err = document.getElementById("search-error");
  err.style.display = "none";
  if (!raw) return showError("Bitte ein Symbol oder Name eingeben");
  if (!DB)  return showError("Daten noch nicht geladen");
  const query  = raw.toUpperCase();
  const needle = raw.toLowerCase();
  const all    = getAllStocks();
  // 1) Exact symbol match
  const exactSym = all.find(x => x.symbol.toUpperCase() === query);
  if (exactSym) return showStockFromDB(exactSym);
  // 2) Partial name/symbol search
  const matches = all.filter(x =>
    x.name.toLowerCase().includes(needle) ||
    x.symbol.toLowerCase().includes(needle)
  );
  if (!matches.length) return showError(`"${raw}" nicht gefunden – weder als Symbol noch als Firmenname.`);
  // 3) Pick best match: exact name=3, starts with=2, contains=1
  const scored = matches.map(s => {
    const name = s.name.toLowerCase();
    const sym  = s.symbol.toLowerCase();
    let score  = 1;
    if (name === needle || sym === needle) score = 3;
    else if (name.startsWith(needle) || sym.startsWith(needle)) score = 2;
    return { s, score };
  });
  scored.sort((a, b) => b.score - a.score);
  showStockFromDB(scored[0].s);
}

// Show error message in search
function showError(msg) {
  const err = document.getElementById("search-error");
  err.textContent = msg;
  err.style.display = "block";
}

// Show stock details in result panel
function showStockFromDB(s) {
  document.getElementById("search-error").style.display = "none";
  document.getElementById("result-panel").style.display = "block";
  const m = s.metrics;
  const fmt = (v, suffix="", digits=2) => v != null ? v.toLocaleString("de-DE",{minimumFractionDigits:digits,maximumFractionDigits:digits}) + suffix : "–";
  let scoreLabel = "Schwach", scoreIcon = '<i class="fas fa-circle" style="color: #e74c3c;"></i>';
  if (s.score >= 80) { scoreLabel = "Exzellent"; scoreIcon = '<i class="fas fa-circle" style="color: #27ae60;"></i>'; }
  else if (s.score >= 60) { scoreLabel = "Gut"; scoreIcon = '<i class="fas fa-circle" style="color: #f39c12;"></i>'; }
  else if (s.score >= 40) { scoreLabel = "Durchschnitt"; scoreIcon = '<i class="fas fa-circle" style="color: #e67e22;"></i>'; }
  const metricsHTML = [
    { label: "KGV (P/E)", value: fmt(m.pe, "", 2), score: s.scoreDetails?.pe },
    { label: "KBV (P/B)", value: fmt(m.pb, "", 2), score: s.scoreDetails?.pb },
    { label: "ROE", value: fmt(m.roe, "%", 1), score: s.scoreDetails?.roe },
    { label: "Bruttomarge", value: fmt(m.grossMargin, "%",1), score: s.scoreDetails?.grossMargin },
    { label: "Nettomarge", value: fmt(m.netMargin, "%",1), score: s.scoreDetails?.netMargin },
    { label: "Verschuldungsgrad D/E", value: fmt(m.debtToEquity,"",2), score: s.scoreDetails?.debtToEquity },
    { label: "Current Ratio", value: fmt(m.currentRatio,"",2), score: s.scoreDetails?.currentRatio },
    { label: "Umsatzwachstum", value: fmt(m.revenueGrowth,"%",1), score: s.scoreDetails?.revenueGrowth },
    { label: "KPS (P/S)", value: fmt(m.ps,"",2) },
    { label: "EPS", value: fmt(m.eps,"",2) },
    { label: "Vortagesschluss", value: fmt(m.previousClose, " " + s.currency, 2) },
    { label: "Dividendenrendite", value: fmt(m.dividendYield,"%",2) },
  ].map(row => {
    const scoreStr = row.score ? `<div class="metric-score">${row.score.score}/${row.score.max} Pkt.</div>` : "";
    return `<div class="metric-item">
      <div class="metric-label">${row.label}</div>
      <div class="metric-value">${row.value}</div>
      ${scoreStr}
    </div>`;
  }).join("");
  const inWL = watchlist.some(w => w.symbol === s.symbol);
  document.getElementById("result-content").innerHTML = `
    <div>
      <div>
        <h3>${s.name}</h3>
        <p style="color:#999;font-size:0.88em;margin-top:4px;">${s.symbol} · ${s.currency}</p>
      </div>
      <div>
        <div class="stock-price">${fmt(m.previousClose,"",2)}</div>
        <div class="stock-currency">${s.currency}</div>
      </div>
    </div>
    <div class="score-card">
      <div>${s.score}</div>
      <div>${scoreIcon} ${scoreLabel}</div>
      <div>Gesamtscore (max. 100 Pkt.)</div>
    </div>
    <div class="metrics-grid">${metricsHTML}</div>
    <button id="add-wl-btn" class="${inWL ? 'in-watchlist' : ''}"
      onclick="toggleWatchlist(${JSON.stringify(s).replace(/"/g,'&quot;')})">
      <i class="fas ${inWL ? 'fa-check' : 'fa-plus'}"></i> ${inWL ? "In Watchlist" : "Zur Watchlist hinzufügen"}
    </button>
  `;
}

/* ── Watchlist ── */
// Add/remove stock from watchlist
function toggleWatchlist(s) {
  const idx = watchlist.findIndex(w => w.symbol === s.symbol);
  if (idx >= 0) watchlist.splice(idx, 1);
  else watchlist.push({ symbol: s.symbol, name: s.name, score: s.score });
  localStorage.setItem("wl", JSON.stringify(watchlist));
  renderWatchlist();
  // Update button
  const btn = document.getElementById("add-wl-btn");
  const inWL = watchlist.some(w => w.symbol === s.symbol);
  if (btn) {
    btn.innerHTML = inWL ? '<i class="fas fa-check"></i> In Watchlist' : '<i class="fas fa-plus"></i> Zur Watchlist hinzufügen';
    btn.classList.toggle("in-watchlist", inWL);
  }
}

// Clear watchlist
document.getElementById("clear-wl").addEventListener("click", () => {
  watchlist = [];
  localStorage.setItem("wl", "[]");
  renderWatchlist();
});

// Render watchlist panel
function renderWatchlist() {
  const el = document.getElementById("watchlist");
  if (!watchlist.length) {
    el.innerHTML = '<div style="text-align:center;color:#999;padding:30px 0;font-size:0.9em;">Noch keine Aktien gespeichert</div>';
    return;
  }
  el.innerHTML = watchlist.map(w => `
    <div class="watchlist-item" onclick="loadFromWatchlist('${w.symbol}')">
      <span>${w.symbol}</span>
      <span>${w.name}</span>
      <span>${w.score}</span>
      <button onclick="event.stopPropagation();removeWL('${w.symbol}')"><i class="fas fa-times"></i></button>
    </div>
  `).join("");
}

// Load stock from watchlist by symbol
function loadFromWatchlist(sym) {
  if (!DB) return;
  for (const mkt of Object.values(DB.markets)) {
    const s = mkt.stocks.find(x => x.symbol === sym);
    if (s) { showStockFromDB(s); return; }
  }
}

// Remove stock from watchlist
function removeWL(sym) {
  watchlist = watchlist.filter(w => w.symbol !== sym);
  localStorage.setItem("wl", JSON.stringify(watchlist));
  renderWatchlist();
}

/* ── Init ── */
// Init: render watchlist and load data
renderWatchlist();
loadData();
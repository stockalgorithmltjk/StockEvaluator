// Haupt-Applikation
class StockAnalyzerApp {
    constructor() {
        this.currentCompany = null;
        this.watchlist = this.loadWatchlist();
        this.init();
    }

    /**
     * Initialisierung
     */
    init() {
        this.setupEventListeners();
        this.renderWatchlist();
    }

    /**
     * Event Listeners einrichten
     */
    setupEventListeners() {
        // Tab Navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Suche
        document.getElementById('search-btn').addEventListener('click', () => this.searchStock());
        document.getElementById('stock-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchStock();
        });

        // Index-Analyse
        document.getElementById('analyze-index-btn').addEventListener('click', () => this.analyzeIndex());

        // Watchlist
        document.getElementById('clear-watchlist').addEventListener('click', () => this.clearWatchlist());

        // Modal
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target.id === 'company-modal') this.closeModal();
        });
    }

    /**
     * Tab wechseln
     */
    switchTab(tabName) {
        // Buttons updaten
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Content updaten
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Watchlist neu rendern wenn geöffnet
        if (tabName === 'watchlist') {
            this.renderWatchlist();
        }
    }

    /**
     * Aktie suchen und analysieren
     */
    async searchStock() {
        const input = document.getElementById('stock-search');
        const symbol = input.value.trim().toUpperCase();

        if (!symbol) {
            this.showAlert('Bitte Symbol eingeben', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const data = await financeAPI.getCompanyData(symbol);
            const scores = scoringEngine.calculateScore(data);
            
            this.currentCompany = { ...data, scores };
            this.displayCompanyCard(this.currentCompany);
            
        } catch (error) {
            this.showAlert(`Fehler beim Laden: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Unternehmens-Karte anzeigen
     */
    displayCompanyCard(company) {
        const resultsDiv = document.getElementById('search-results');
        
        const scoreClass = scoringEngine.getScoreClass(company.scores.total);
        const scoreLabel = scoringEngine.getScoreLabel(company.scores.total);

        resultsDiv.innerHTML = `
            <div class="score-card">
                <div class="score-header">
                    <div class="company-info">
                        <h2>${company.name}</h2>
                        <p class="sector">${company.symbol} • ${company.sector} • ${company.country}</p>
                    </div>
                    <div class="main-score">
                        <div class="score-value ${scoreClass}">${company.scores.total}</div>
                        <div class="score-label">${scoreLabel}</div>
                    </div>
                </div>

                <div class="sub-scores">
                    <div class="sub-score">
                        <div class="sub-score-name">Value Score</div>
                        <div class="sub-score-value">${company.scores.valuation.toFixed(0)}/25</div>
                    </div>
                    <div class="sub-score">
                        <div class="sub-score-name">Quality Score</div>
                        <div class="sub-score-value">${company.scores.profitability.toFixed(0)}/25</div>
                    </div>
                    <div class="sub-score">
                        <div class="sub-score-name">Stability Score</div>
                        <div class="sub-score-value">${company.scores.stability.toFixed(0)}/20</div>
                    </div>
                    <div class="sub-score">
                        <div class="sub-score-name">Income Score</div>
                        <div class="sub-score-value">${company.scores.dividend.toFixed(0)}/15</div>
                    </div>
                    <div class="sub-score">
                        <div class="sub-score-name">Growth Score</div>
                        <div class="sub-score-value">${company.scores.growth.toFixed(0)}/15</div>
                    </div>
                </div>

                <div class="metrics-grid">
                    ${this.renderMetric('KGV (P/E)', company.pe, 'x')}
                    ${this.renderMetric('KBV (P/B)', company.pb, 'x')}
                    ${this.renderMetric('PEG-Ratio', company.peg, '')}
                    ${this.renderMetric('Gewinnmarge', company.profitMargin, '%', 100)}
                    ${this.renderMetric('ROE', company.roe, '%', 100)}
                    ${this.renderMetric('ROA', company.roa, '%', 100)}
                    ${this.renderMetric('Verschuldung', company.debtToEquity, 'x')}
                    ${this.renderMetric('Liquidität', company.currentRatio, 'x')}
                    ${this.renderMetric('Dividendenrendite', company.dividendYield, '%', 100)}
                    ${this.renderMetric('Ausschüttungsquote', company.payoutRatio, '%', 100)}
                    ${this.renderMetric('Umsatzwachstum', company.revenueGrowth, '%', 100)}
                    ${this.renderMetric('Gewinnwachstum', company.earningsGrowth, '%', 100)}
                </div>

                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="app.showCompanyDetails()">
                        Details anzeigen
                    </button>
                    <button class="btn btn-secondary" onclick="app.addToWatchlist()">
                        Zur Watchlist hinzufügen
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Einzelne Metrik rendern
     */
    renderMetric(name, value, unit, multiplier = 1) {
        let displayValue = 'k.A.';
        
        if (value !== null && value !== undefined) {
            const numValue = value * multiplier;
            displayValue = numValue.toFixed(2) + unit;
        }

        return `
            <div class="metric">
                <span class="metric-name">${name}</span>
                <span class="metric-value">${displayValue}</span>
            </div>
        `;
    }

    /**
     * Detailansicht im Modal
     */
    showCompanyDetails() {
        if (!this.currentCompany) return;

        const company = this.currentCompany;
        const modal = document.getElementById('company-modal');
        const detailsDiv = document.getElementById('company-details');

        detailsDiv.innerHTML = `
            <h2>${company.name} (${company.symbol})</h2>
            
            <div style="margin: 20px 0;">
                <h3>Unternehmensinformationen</h3>
                <p><strong>Sektor:</strong> ${company.sector}</p>
                <p><strong>Branche:</strong> ${company.industry}</p>
                <p><strong>Land:</strong> ${company.country}</p>
                ${company.employees ? `<p><strong>Mitarbeiter:</strong> ${company.employees.toLocaleString()}</p>` : ''}
                ${company.marketCap ? `<p><strong>Marktkapitalisierung:</strong> ${this.formatLargeNumber(company.marketCap)} ${company.currency}</p>` : ''}
                ${company.description ? `<p><strong>Beschreibung:</strong> ${company.description.substring(0, 500)}...</p>` : ''}
            </div>

            <div style="margin: 20px 0;">
                <h3>Kursinformationen</h3>
                ${company.currentPrice ? `<p><strong>Aktueller Kurs:</strong> ${company.currentPrice.toFixed(2)} ${company.currency}</p>` : ''}
                ${company.week52High ? `<p><strong>52-Wochen-Hoch:</strong> ${company.week52High.toFixed(2)} ${company.currency}</p>` : ''}
                ${company.week52Low ? `<p><strong>52-Wochen-Tief:</strong> ${company.week52Low.toFixed(2)} ${company.currency}</p>` : ''}
                ${company.beta ? `<p><strong>Beta:</strong> ${company.beta.toFixed(2)}</p>` : ''}
            </div>

            <div style="margin: 20px 0;">
                <h3>Score-Details</h3>
                <p><strong>Gesamtscore:</strong> ${company.scores.total}/100</p>
                <p><strong>Bewertung (Valuation):</strong> ${company.scores.valuation.toFixed(0)}/25</p>
                <p><strong>Profitabilität (Quality):</strong> ${company.scores.profitability.toFixed(0)}/25</p>
                <p><strong>Stabilität:</strong> ${company.scores.stability.toFixed(0)}/20</p>
                <p><strong>Dividende (Income):</strong> ${company.scores.dividend.toFixed(0)}/15</p>
                <p><strong>Wachstum (Growth):</strong> ${company.scores.growth.toFixed(0)}/15</p>
            </div>

            <p style="color: #999; font-size: 0.85rem; margin-top: 20px;">
                Letzte Aktualisierung: ${new Date(company.lastUpdate).toLocaleString('de-DE')}
            </p>
        `;

        modal.classList.add('active');
    }

    /**
     * Modal schließen
     */
    closeModal() {
        document.getElementById('company-modal').classList.remove('active');
    }

    /**
     * Zur Watchlist hinzufügen
     */
    addToWatchlist() {
        if (!this.currentCompany) return;

        // Prüfe ob bereits in Watchlist
        const exists = this.watchlist.some(item => item.symbol === this.currentCompany.symbol);
        
        if (exists) {
            this.showAlert('Bereits in Watchlist', 'info');
            return;
        }

        this.watchlist.push({
            symbol: this.currentCompany.symbol,
            name: this.currentCompany.name,
            score: this.currentCompany.scores.total,
            addedAt: new Date().toISOString()
        });

        this.saveWatchlist();
        this.showAlert('Zur Watchlist hinzugefügt', 'success');
    }

    /**
     * Watchlist rendern
     */
    renderWatchlist() {
        const container = document.getElementById('watchlist-content');

        if (this.watchlist.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Watchlist ist leer</h3>
                    <p>Füge Unternehmen hinzu, um sie hier zu verfolgen</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.watchlist.map(item => {
            const scoreClass = scoringEngine.getScoreClass(item.score);
            return `
                <div class="watchlist-item" onclick="app.analyzeWatchlistItem('${item.symbol}')">
                    <div class="watchlist-item-header">
                        <div>
                            <h3>${item.name}</h3>
                            <p style="color: #666; font-size: 0.9rem;">${item.symbol}</p>
                        </div>
                        <div style="display: flex; gap: 15px; align-items: center;">
                            <div class="score-value ${scoreClass}" style="font-size: 1.5rem;">
                                ${item.score}
                            </div>
                            <button class="remove-from-watchlist" onclick="event.stopPropagation(); app.removeFromWatchlist('${item.symbol}')">
                                Entfernen
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Watchlist-Item analysieren
     */
    async analyzeWatchlistItem(symbol) {
        document.getElementById('stock-search').value = symbol;
        this.switchTab('search');
        document.querySelector('[data-tab="search"]').classList.add('active');
        await this.searchStock();
    }

    /**
     * Von Watchlist entfernen
     */
    removeFromWatchlist(symbol) {
        this.watchlist = this.watchlist.filter(item => item.symbol !== symbol);
        this.saveWatchlist();
        this.renderWatchlist();
        this.showAlert('Von Watchlist entfernt', 'info');
    }

    /**
     * Watchlist leeren
     */
    clearWatchlist() {
        if (!confirm('Watchlist wirklich leeren?')) return;
        
        this.watchlist = [];
        this.saveWatchlist();
        this.renderWatchlist();
        this.showAlert('Watchlist geleert', 'info');
    }

    /**
     * Index analysieren
     */
    async analyzeIndex() {
        const select = document.getElementById('index-select');
        const indexKey = select.value;

        if (!indexKey) {
            this.showAlert('Bitte Index auswählen', 'error');
            return;
        }

        this.showLoading(true);
        const resultsDiv = document.getElementById('index-results');
        resultsDiv.innerHTML = '<p>Lade Index-Daten... Dies kann einige Minuten dauern.</p>';

        try {
            const indexData = await financeAPI.getIndexData(indexKey);
            
            // Scores berechnen
            const companiesWithScores = indexData.companies.map(company => {
                const scores = scoringEngine.calculateScore(company);
                return { ...company, scores };
            });

            // Nach Score sortieren
            companiesWithScores.sort((a, b) => b.scores.total - a.scores.total);

            this.displayIndexResults(indexData.indexName, companiesWithScores, indexData.errors);

        } catch (error) {
            this.showAlert(`Fehler beim Laden: ${error.message}`, 'error');
            resultsDiv.innerHTML = '';
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Index-Ergebnisse anzeigen
     */
    displayIndexResults(indexName, companies, errors) {
        const resultsDiv = document.getElementById('index-results');

        let html = `
            <h2>${indexName} - Ranking nach Score</h2>
            ${errors.length > 0 ? `<p class="alert alert-error">Fehler bei ${errors.length} Unternehmen</p>` : ''}
            
            <table class="index-table">
                <thead>
                    <tr>
                        <th>Rang</th>
                        <th>Unternehmen</th>
                        <th>Symbol</th>
                        <th>Sektor</th>
                        <th>Score</th>
                        <th>Bewertung</th>
                    </tr>
                </thead>
                <tbody>
        `;

        companies.forEach((company, index) => {
            const scoreClass = scoringEngine.getScoreClass(company.scores.total);
            const scoreLabel = scoringEngine.getScoreLabel(company.scores.total);

            html += `
                <tr onclick="app.loadCompanyFromIndex('${company.symbol}')">
                    <td><span class="rank-badge">${index + 1}</span></td>
                    <td><strong>${company.name}</strong></td>
                    <td>${company.symbol}</td>
                    <td>${company.sector}</td>
                    <td><span class="score-value ${scoreClass}" style="font-size: 1.3rem;">${company.scores.total}</span></td>
                    <td>${scoreLabel}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        resultsDiv.innerHTML = html;
    }

    /**
     * Unternehmen aus Index laden
     */
    async loadCompanyFromIndex(symbol) {
        document.getElementById('stock-search').value = symbol;
        this.switchTab('search');
        document.querySelector('[data-tab="search"]').classList.add('active');
        await this.searchStock();
    }

    /**
     * Watchlist speichern
     */
    saveWatchlist() {
        localStorage.setItem('stockWatchlist', JSON.stringify(this.watchlist));
    }

    /**
     * Watchlist laden
     */
    loadWatchlist() {
        const saved = localStorage.getItem('stockWatchlist');
        return saved ? JSON.parse(saved) : [];
    }

    /**
     * Alert anzeigen
     */
    showAlert(message, type = 'info') {
        // Einfache Alert-Implementierung
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '3000';
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    /**
     * Loading-Spinner
     */
    showLoading(show) {
        const loader = document.getElementById('loading');
        if (show) {
            loader.classList.remove('hidden');
        } else {
            loader.classList.add('hidden');
        }
    }

    /**
     * Große Zahlen formatieren
     */
    formatLargeNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + ' T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + ' Mrd';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + ' Mio';
        return num.toLocaleString();
    }
}

// App initialisieren wenn DOM geladen
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new StockAnalyzerApp();
});

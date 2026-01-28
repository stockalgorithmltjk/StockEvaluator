// API Handler für Finanzdaten
class FinanceAPI {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 Minuten Cache
    }

    /**
     * Hauptfunktion: Hole Unternehmensdaten
     */
    async getCompanyData(symbol) {
        // Cache prüfen
        const cached = this.getFromCache(symbol);
        if (cached) return cached;

        try {
            // Versuche verschiedene Datenquellen
            let data;
            
            // Primär: Yahoo Finance (kein API Key nötig)
            data = await this.fetchFromYahooFinance(symbol);
            
            // Fallback: Alpha Vantage
            if (!data && CONFIG.ALPHA_VANTAGE_KEY !== 'demo') {
                data = await this.fetchFromAlphaVantage(symbol);
            }

            if (data) {
                this.saveToCache(symbol, data);
                return data;
            }

            throw new Error('Keine Daten gefunden');
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Yahoo Finance API (über query2.finance.yahoo.com)
     */
    async fetchFromYahooFinance(symbol) {
        try {
            // Quote Summary für Basisdaten
            const quoteUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=summaryDetail,financialData,defaultKeyStatistics,price,summaryProfile`;
            
            const response = await fetch(quoteUrl);
            if (!response.ok) throw new Error('Yahoo Finance API Fehler');
            
            const json = await response.json();
            const result = json.quoteSummary.result[0];

            return this.parseYahooFinanceData(result, symbol);
        } catch (error) {
            console.error('Yahoo Finance Error:', error);
            return null;
        }
    }

    /**
     * Parse Yahoo Finance Daten
     */
    parseYahooFinanceData(data, symbol) {
        const summaryDetail = data.summaryDetail || {};
        const financialData = data.financialData || {};
        const keyStats = data.defaultKeyStatistics || {};
        const price = data.price || {};
        const profile = data.summaryProfile || {};

        // Hilfsfunktion für Werte-Extraktion
        const getValue = (obj) => {
            if (!obj) return null;
            return obj.raw !== undefined ? obj.raw : obj;
        };

        return {
            symbol: symbol,
            name: price.shortName || price.longName || symbol,
            sector: profile.sector || 'N/A',
            industry: profile.industry || 'N/A',
            country: profile.country || 'N/A',
            description: profile.longBusinessSummary || '',
            currency: price.currency || 'USD',
            
            // Bewertungskennzahlen
            pe: getValue(summaryDetail.trailingPE) || getValue(keyStats.trailingPE),
            forwardPE: getValue(summaryDetail.forwardPE),
            pb: getValue(keyStats.priceToBook),
            peg: getValue(keyStats.pegRatio),
            
            // Profitabilitätskennzahlen
            profitMargin: getValue(financialData.profitMargins),
            roe: getValue(financialData.returnOnEquity),
            roa: getValue(financialData.returnOnAssets),
            
            // Stabilitätskennzahlen
            debtToEquity: getValue(financialData.debtToEquity) ? getValue(financialData.debtToEquity) / 100 : null,
            currentRatio: getValue(financialData.currentRatio),
            quickRatio: getValue(financialData.quickRatio),
            interestCoverage: null, // Nicht in Yahoo Finance verfügbar
            
            // Dividendenkennzahlen
            dividendYield: getValue(summaryDetail.dividendYield) || getValue(summaryDetail.trailingAnnualDividendYield),
            payoutRatio: getValue(summaryDetail.payoutRatio),
            dividendRate: getValue(summaryDetail.dividendRate),
            
            // Wachstumskennzahlen
            revenueGrowth: getValue(financialData.revenueGrowth),
            earningsGrowth: getValue(financialData.earningsGrowth),
            
            // Weitere Daten
            marketCap: getValue(summaryDetail.marketCap) || getValue(price.marketCap),
            enterpriseValue: getValue(keyStats.enterpriseValue),
            beta: getValue(keyStats.beta),
            week52High: getValue(summaryDetail.fiftyTwoWeekHigh),
            week52Low: getValue(summaryDetail.fiftyTwoWeekLow),
            currentPrice: getValue(price.regularMarketPrice),
            
            // Mitarbeiterzahl
            employees: profile.fullTimeEmployees || null,
            
            // Timestamp
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Alpha Vantage API (Fallback)
     */
    async fetchFromAlphaVantage(symbol) {
        try {
            const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${CONFIG.ALPHA_VANTAGE_KEY}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Alpha Vantage API Fehler');
            
            const data = await response.json();
            
            if (data.Note || data['Error Message']) {
                throw new Error('API Limit erreicht oder Symbol nicht gefunden');
            }

            return this.parseAlphaVantageData(data);
        } catch (error) {
            console.error('Alpha Vantage Error:', error);
            return null;
        }
    }

    /**
     * Parse Alpha Vantage Daten
     */
    parseAlphaVantageData(data) {
        const parseNumber = (val) => {
            if (!val || val === 'None' || val === '-') return null;
            const num = parseFloat(val);
            return isNaN(num) ? null : num;
        };

        return {
            symbol: data.Symbol,
            name: data.Name,
            sector: data.Sector || 'N/A',
            industry: data.Industry || 'N/A',
            country: data.Country || 'N/A',
            description: data.Description || '',
            currency: data.Currency || 'USD',
            
            pe: parseNumber(data.TrailingPE),
            forwardPE: parseNumber(data.ForwardPE),
            pb: parseNumber(data.PriceToBookRatio),
            peg: parseNumber(data.PEGRatio),
            
            profitMargin: parseNumber(data.ProfitMargin),
            roe: parseNumber(data.ReturnOnEquityTTM),
            roa: parseNumber(data.ReturnOnAssetsTTM),
            
            debtToEquity: parseNumber(data.DebtToEquity) ? parseNumber(data.DebtToEquity) / 100 : null,
            currentRatio: parseNumber(data.CurrentRatio),
            quickRatio: parseNumber(data.QuickRatio),
            interestCoverage: null,
            
            dividendYield: parseNumber(data.DividendYield),
            payoutRatio: parseNumber(data.PayoutRatio),
            dividendRate: parseNumber(data.DividendPerShare),
            
            revenueGrowth: parseNumber(data.QuarterlyRevenueGrowthYOY),
            earningsGrowth: parseNumber(data.QuarterlyEarningsGrowthYOY),
            
            marketCap: parseNumber(data.MarketCapitalization),
            enterpriseValue: null,
            beta: parseNumber(data.Beta),
            week52High: parseNumber(data['52WeekHigh']),
            week52Low: parseNumber(data['52WeekLow']),
            currentPrice: null,
            
            employees: parseInt(data.FullTimeEmployees) || null,
            
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Hole Index-Daten
     */
    async getIndexData(indexKey) {
        const index = INDICES[indexKey];
        if (!index) throw new Error('Index nicht gefunden');

        const results = [];
        const batchSize = 5; // Parallel requests
        
        for (let i = 0; i < index.symbols.length; i += batchSize) {
            const batch = index.symbols.slice(i, i + batchSize);
            const promises = batch.map(symbol => 
                this.getCompanyData(symbol)
                    .then(data => ({ success: true, data }))
                    .catch(error => ({ success: false, symbol, error: error.message }))
            );
            
            const batchResults = await Promise.all(promises);
            results.push(...batchResults);
            
            // Rate limiting: Warte zwischen Batches
            if (i + batchSize < index.symbols.length) {
                await this.delay(1000); // 1 Sekunde Pause
            }
        }

        return {
            indexName: index.name,
            companies: results.filter(r => r.success).map(r => r.data),
            errors: results.filter(r => !r.success)
        };
    }

    /**
     * Cache-Management
     */
    getFromCache(symbol) {
        const cached = this.cache.get(symbol);
        if (!cached) return null;
        
        const now = Date.now();
        if (now - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(symbol);
            return null;
        }
        
        return cached.data;
    }

    saveToCache(symbol, data) {
        this.cache.set(symbol, {
            data: data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    /**
     * Hilfsfunktion: Verzögerung
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Symbol-Suche (vereinfacht)
     */
    async searchSymbol(query) {
        // Für echte Implementierung würde man eine Search-API nutzen
        // Hier: Einfache Vorschläge basierend auf bekannten Symbolen
        const suggestions = [];
        
        // Durchsuche alle Index-Symbole
        for (const indexKey in INDICES) {
            const index = INDICES[indexKey];
            const matches = index.symbols.filter(s => 
                s.toLowerCase().includes(query.toLowerCase())
            );
            suggestions.push(...matches);
        }

        // Entferne Duplikate
        return [...new Set(suggestions)];
    }
}

// Globale Instanz
const financeAPI = new FinanceAPI();

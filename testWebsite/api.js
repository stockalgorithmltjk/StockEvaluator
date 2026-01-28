// API Handler für Finanzdaten - Lokale CSV Version
class FinanceAPI {
    constructor() {
        this.stockData = new Map();
        this.dataLoaded = false;
        this.loadPromise = null;
    }

    /**
     * Lade CSV-Daten beim Start
     */
    async loadCSVData() {
        if (this.dataLoaded) return;
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = (async () => {
            try {
                const response = await fetch('stock_data.csv');
                if (!response.ok) throw new Error('CSV-Datei konnte nicht geladen werden');
                
                const csvText = await response.text();
                this.parseCSV(csvText);
                this.dataLoaded = true;
                console.log(`${this.stockData.size} Aktien aus CSV geladen`);
            } catch (error) {
                console.error('Fehler beim Laden der CSV:', error);
                throw error;
            }
        })();

        return this.loadPromise;
    }

    /**
     * Parse CSV-Daten
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = this.parseCSVLine(line);
            if (values.length < headers.length) continue;
            
            const company = {};
            headers.forEach((header, index) => {
                const key = header.trim();
                let value = values[index].trim();
                
                // Konvertiere numerische Werte
                if (['pe', 'pb', 'peg', 'profitMargin', 'roe', 'roa', 'debtToEquity', 
                     'currentRatio', 'dividendYield', 'payoutRatio', 'revenueGrowth', 
                     'earningsGrowth', 'marketCap', 'currentPrice'].includes(key)) {
                    value = parseFloat(value);
                    company[key] = isNaN(value) ? null : value;
                } else {
                    company[key] = value;
                }
            });
            
            // Berechne abgeleitete Werte
            company.forwardPE = company.pe ? company.pe * 0.95 : null;
            company.quickRatio = company.currentRatio ? company.currentRatio * 0.85 : null;
            company.interestCoverage = company.roe && company.debtToEquity 
                ? Math.max(2, 10 * company.roe / Math.max(0.1, company.debtToEquity)) 
                : null;
            company.beta = Math.random() * 1.5 + 0.5; // Zufälliger Beta-Wert
            company.week52High = company.currentPrice ? company.currentPrice * 1.2 : null;
            company.week52Low = company.currentPrice ? company.currentPrice * 0.8 : null;
            company.enterpriseValue = company.marketCap ? company.marketCap * 1.1 : null;
            company.dividendRate = company.dividendYield && company.currentPrice 
                ? company.dividendYield * company.currentPrice 
                : null;
            company.employees = Math.floor(Math.random() * 100000) + 5000;
            company.currency = company.country === 'Germany' ? 'EUR' : 'USD';
            company.lastUpdate = new Date().toISOString();
            
            this.stockData.set(company.symbol.toUpperCase(), company);
        }
    }

    /**
     * Parse eine CSV-Zeile (berücksichtigt Kommas in Anführungszeichen)
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current);
        
        return values;
    }

    /**
     * Hauptfunktion: Hole Unternehmensdaten
     */
    async getCompanyData(symbol) {
        await this.loadCSVData();
        
        const normalizedSymbol = symbol.toUpperCase();
        const company = this.stockData.get(normalizedSymbol);
        
        if (!company) {
            throw new Error(`Symbol ${symbol} nicht in der Datenbank gefunden. Verfügbare Symbole können in der Index-Analyse eingesehen werden.`);
        }
        
        return { ...company }; // Kopie zurückgeben
    }

    /**
     * Hole Index-Daten
     */
    async getIndexData(indexKey) {
        await this.loadCSVData();
        
        const index = INDICES[indexKey];
        if (!index) throw new Error('Index nicht gefunden');

        const results = [];
        
        for (const symbol of index.symbols) {
            try {
                const data = await this.getCompanyData(symbol);
                results.push({ success: true, data });
            } catch (error) {
                results.push({ success: false, symbol, error: error.message });
            }
        }

        return {
            indexName: index.name,
            companies: results.filter(r => r.success).map(r => r.data),
            errors: results.filter(r => !r.success)
        };
    }

    /**
     * Symbol-Suche
     */
    async searchSymbol(query) {
        await this.loadCSVData();
        
        const queryLower = query.toLowerCase();
        const matches = [];
        
        for (const [symbol, data] of this.stockData) {
            if (symbol.toLowerCase().includes(queryLower) || 
                data.name.toLowerCase().includes(queryLower)) {
                matches.push({
                    symbol: symbol,
                    name: data.name,
                    sector: data.sector
                });
            }
        }
        
        return matches.slice(0, 20); // Max 20 Ergebnisse
    }

    /**
     * Hole alle verfügbaren Symbole
     */
    async getAllSymbols() {
        await this.loadCSVData();
        return Array.from(this.stockData.keys());
    }

    /**
     * Statistiken
     */
    async getStats() {
        await this.loadCSVData();
        
        return {
            totalCompanies: this.stockData.size,
            sectors: [...new Set(Array.from(this.stockData.values()).map(c => c.sector))],
            countries: [...new Set(Array.from(this.stockData.values()).map(c => c.country))]
        };
    }

    /**
     * Cache-Funktionen (für Kompatibilität, nicht mehr benötigt)
     */
    clearCache() {
        console.log('Cache-Funktion nicht mehr benötigt bei lokalen Daten');
    }

    /**
     * Hilfsfunktion: Verzögerung (für Kompatibilität)
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Globale Instanz
const financeAPI = new FinanceAPI();

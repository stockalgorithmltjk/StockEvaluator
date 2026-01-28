// Scoring Engine
class ScoringEngine {
    constructor() {
        this.weights = {
            valuation: 25,
            profitability: 25,
            stability: 20,
            dividend: 15,
            growth: 15
        };
    }

    /**
     * Hauptfunktion: Berechnet Gesamtscore und Sub-Scores
     */
    calculateScore(data) {
        const scores = {
            total: 0,
            valuation: this.calculateValuationScore(data),
            profitability: this.calculateProfitabilityScore(data),
            stability: this.calculateStabilityScore(data),
            dividend: this.calculateDividendScore(data),
            growth: this.calculateGrowthScore(data),
            details: {}
        };

        // Gesamtscore berechnen
        scores.total = (
            (scores.valuation * this.weights.valuation) +
            (scores.profitability * this.weights.profitability) +
            (scores.stability * this.weights.stability) +
            (scores.dividend * this.weights.dividend) +
            (scores.growth * this.weights.growth)
        ) / 100;

        // Negativ-Filter anwenden
        scores.total = this.applyNegativeFilters(scores.total, data);

        // Details speichern
        scores.details = this.getScoreDetails(data);

        return scores;
    }

    /**
     * Bewertungs-Score (25 Punkte max)
     * - KGV: 10 Punkte
     * - KBV: 10 Punkte
     * - PEG-Ratio: 5 Punkte
     */
    calculateValuationScore(data) {
        let score = 0;
        const sector = data.sector || 'Technology';
        const adjustment = SECTOR_ADJUSTMENTS[sector] || { peMultiplier: 1.0, pegMultiplier: 1.0 };

        // KGV (10 Punkte)
        if (data.pe !== null && data.pe > 0) {
            const adjustedPE = data.pe / adjustment.peMultiplier;
            if (adjustedPE < 10) score += 10;
            else if (adjustedPE < 15) score += 8;
            else if (adjustedPE < 20) score += 6;
            else if (adjustedPE < 25) score += 4;
            else if (adjustedPE < 30) score += 2;
        }

        // KBV (10 Punkte)
        if (data.pb !== null && data.pb > 0) {
            if (data.pb < 1) score += 10;
            else if (data.pb < 2) score += 8;
            else if (data.pb < 3) score += 6;
            else if (data.pb < 5) score += 4;
            else if (data.pb < 7) score += 2;
        }

        // PEG-Ratio (5 Punkte)
        if (data.peg !== null && data.peg > 0) {
            const adjustedPEG = data.peg / adjustment.pegMultiplier;
            if (adjustedPEG < 1) score += 5;
            else if (adjustedPEG < 1.5) score += 4;
            else if (adjustedPEG < 2) score += 3;
            else if (adjustedPEG < 2.5) score += 2;
            else if (adjustedPEG < 3) score += 1;
        }

        return Math.min(score, 25);
    }

    /**
     * Profitabilitäts-Score (25 Punkte max)
     * - Gewinnmarge: 10 Punkte
     * - ROE: 10 Punkte
     * - ROA: 5 Punkte
     */
    calculateProfitabilityScore(data) {
        let score = 0;

        // Gewinnmarge (10 Punkte)
        if (data.profitMargin !== null) {
            const margin = data.profitMargin * 100;
            if (margin >= 20) score += 10;
            else if (margin >= 15) score += 8;
            else if (margin >= 10) score += 6;
            else if (margin >= 5) score += 4;
            else if (margin >= 0) score += 2;
        }

        // ROE - Return on Equity (10 Punkte)
        if (data.roe !== null) {
            const roe = data.roe * 100;
            if (roe >= 20) score += 10;
            else if (roe >= 15) score += 8;
            else if (roe >= 10) score += 6;
            else if (roe >= 5) score += 4;
            else if (roe > 0) score += 2;
        }

        // ROA - Return on Assets (5 Punkte)
        if (data.roa !== null) {
            const roa = data.roa * 100;
            if (roa >= 10) score += 5;
            else if (roa >= 7) score += 4;
            else if (roa >= 5) score += 3;
            else if (roa >= 3) score += 2;
            else if (roa > 0) score += 1;
        }

        return Math.min(score, 25);
    }

    /**
     * Finanzielle Stabilitäts-Score (20 Punkte max)
     * - Verschuldungsgrad: 10 Punkte
     * - Current Ratio: 5 Punkte
     * - Zinsdeckungsgrad: 5 Punkte
     */
    calculateStabilityScore(data) {
        let score = 0;

        // Verschuldungsgrad (Debt to Equity) (10 Punkte)
        if (data.debtToEquity !== null && data.debtToEquity >= 0) {
            if (data.debtToEquity < 0.5) score += 10;
            else if (data.debtToEquity < 1.0) score += 8;
            else if (data.debtToEquity < 1.5) score += 6;
            else if (data.debtToEquity < 2.0) score += 4;
            else if (data.debtToEquity < 3.0) score += 2;
        }

        // Current Ratio (Liquidität) (5 Punkte)
        if (data.currentRatio !== null) {
            if (data.currentRatio >= 2.0) score += 5;
            else if (data.currentRatio >= 1.5) score += 4;
            else if (data.currentRatio >= 1.0) score += 3;
            else if (data.currentRatio >= 0.8) score += 2;
            else if (data.currentRatio > 0) score += 1;
        }

        // Zinsdeckungsgrad (Interest Coverage) (5 Punkte)
        // Wenn nicht verfügbar, wird 0 vergeben
        if (data.interestCoverage !== null) {
            if (data.interestCoverage >= 10) score += 5;
            else if (data.interestCoverage >= 5) score += 4;
            else if (data.interestCoverage >= 3) score += 3;
            else if (data.interestCoverage >= 2) score += 2;
            else if (data.interestCoverage > 1) score += 1;
        }

        return Math.min(score, 20);
    }

    /**
     * Dividenden-Score (15 Punkte max)
     * - Dividendenrendite: 8 Punkte
     * - Ausschüttungsquote: 7 Punkte
     */
    calculateDividendScore(data) {
        let score = 0;

        // Dividendenrendite (8 Punkte)
        if (data.dividendYield !== null && data.dividendYield > 0) {
            const yieldPercent = data.dividendYield * 100;
            if (yieldPercent >= 4) score += 8;
            else if (yieldPercent >= 3) score += 6;
            else if (yieldPercent >= 2) score += 4;
            else if (yieldPercent >= 1) score += 2;
        }

        // Ausschüttungsquote (Payout Ratio) (7 Punkte)
        if (data.payoutRatio !== null && data.payoutRatio > 0) {
            const payout = data.payoutRatio * 100;
            // Optimal zwischen 30-60%
            if (payout >= 30 && payout <= 60) score += 7;
            else if (payout >= 20 && payout <= 70) score += 5;
            else if (payout >= 10 && payout <= 80) score += 3;
            else if (payout < 100) score += 1;
        }

        return Math.min(score, 15);
    }

    /**
     * Wachstums-Score (15 Punkte max)
     * - Umsatzwachstum: 8 Punkte
     * - Gewinnwachstum: 7 Punkte
     */
    calculateGrowthScore(data) {
        let score = 0;

        // Umsatzwachstum (Revenue Growth YoY) (8 Punkte)
        if (data.revenueGrowth !== null) {
            const growth = data.revenueGrowth * 100;
            if (growth >= 15) score += 8;
            else if (growth >= 10) score += 6;
            else if (growth >= 5) score += 4;
            else if (growth >= 0) score += 2;
        }

        // Gewinnwachstum (Earnings Growth) (7 Punkte)
        if (data.earningsGrowth !== null) {
            const growth = data.earningsGrowth * 100;
            if (growth >= 15) score += 7;
            else if (growth >= 10) score += 5;
            else if (growth >= 5) score += 3;
            else if (growth >= 0) score += 1;
        }

        return Math.min(score, 15);
    }

    /**
     * Negativ-Filter anwenden
     */
    applyNegativeFilters(score, data) {
        let adjustedScore = score;

        // Negatives Eigenkapital
        if (data.roe !== null && data.roe < 0) {
            adjustedScore = Math.min(adjustedScore, 30);
        }

        // Extreme Verschuldung
        if (data.debtToEquity !== null && data.debtToEquity > 2.0) {
            adjustedScore = Math.min(adjustedScore, 50);
        }

        // Anhaltende Verluste
        if (data.profitMargin !== null && data.profitMargin < 0 &&
            data.earningsGrowth !== null && data.earningsGrowth < 0) {
            adjustedScore = Math.min(adjustedScore, 40);
        }

        return Math.round(adjustedScore);
    }

    /**
     * Detaillierte Score-Aufschlüsselung
     */
    getScoreDetails(data) {
        return {
            pe: data.pe,
            pb: data.pb,
            peg: data.peg,
            profitMargin: data.profitMargin,
            roe: data.roe,
            roa: data.roa,
            debtToEquity: data.debtToEquity,
            currentRatio: data.currentRatio,
            dividendYield: data.dividendYield,
            payoutRatio: data.payoutRatio,
            revenueGrowth: data.revenueGrowth,
            earningsGrowth: data.earningsGrowth
        };
    }

    /**
     * Score-Klassifizierung
     */
    getScoreClass(score) {
        if (score >= 70) return 'green';
        if (score >= 41) return 'yellow';
        return 'red';
    }

    /**
     * Score-Label
     */
    getScoreLabel(score) {
        if (score >= 70) return 'Attraktiv';
        if (score >= 41) return 'Durchschnittlich';
        return 'Nicht empfohlen';
    }
}

// Globale Instanz
const scoringEngine = new ScoringEngine();

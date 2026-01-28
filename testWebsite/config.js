// API Konfiguration
const CONFIG = {
    // Alpha Vantage API (kostenlos, 500 Calls/Tag)
    // Registrierung: https://www.alphavantage.co/support/#api-key
    ALPHA_VANTAGE_KEY: 'demo', // WICHTIG: Ersetze 'demo' mit deinem eigenen API Key!
    
    // Fallback: Yahoo Finance (keine API Key nötig, aber limitiert)
    USE_YAHOO_FINANCE: true
};

// Index Zusammensetzungen (Top Unternehmen)
const INDICES = {
    dax: {
        name: 'DAX 40',
        symbols: [
            'SAP.DE', 'SIE.DE', 'ALV.DE', 'DTE.DE', 'VOW3.DE',
            'MBG.DE', 'ADS.DE', 'BAS.DE', 'BMW.DE', 'DAI.DE',
            'DB1.DE', 'DBK.DE', 'EOAN.DE', 'FRE.DE', 'HEI.DE',
            'HEN3.DE', 'IFX.DE', 'LIN.DE', 'MRK.DE', 'MUV2.DE',
            'RWE.DE', 'VOW.DE', 'BEI.DE', 'CON.DE', 'DPW.DE',
            'HNR1.DE', 'PUM.DE', 'QIA.DE', 'SHL.DE', 'ZAL.DE',
            '1COV.DE', 'AIR.DE', 'BNR.DE', 'ENR.DE', 'FME.DE',
            'HFG.DE', 'PAH3.DE', 'P911.DE', 'SRT3.DE', 'WCH.DE'
        ]
    },
    sp500: {
        name: 'S&P 500 (Top 50)',
        symbols: [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA',
            'META', 'TSLA', 'BRK.B', 'UNH', 'XOM',
            'JNJ', 'JPM', 'V', 'PG', 'MA',
            'HD', 'CVX', 'MRK', 'ABBV', 'PEP',
            'KO', 'AVGO', 'COST', 'LLY', 'TMO',
            'WMT', 'MCD', 'CSCO', 'ACN', 'ABT',
            'DHR', 'ADBE', 'VZ', 'NKE', 'NFLX',
            'CRM', 'TXN', 'PM', 'NEE', 'CMCSA',
            'DIS', 'UPS', 'HON', 'INTC', 'QCOM',
            'T', 'AMGN', 'BA', 'IBM', 'GE'
        ]
    },
    nasdaq: {
        name: 'NASDAQ 100 (Top 50)',
        symbols: [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA',
            'META', 'TSLA', 'AVGO', 'COST', 'ASML',
            'NFLX', 'ADBE', 'PEP', 'CSCO', 'TMUS',
            'AMD', 'CMCSA', 'INTC', 'QCOM', 'INTU',
            'TXN', 'HON', 'AMGN', 'AMAT', 'SBUX',
            'BKNG', 'ISRG', 'ADI', 'GILD', 'MDLZ',
            'VRTX', 'REGN', 'ADP', 'LRCX', 'PANW',
            'MU', 'CSX', 'KLAC', 'SNPS', 'CDNS',
            'MELI', 'PYPL', 'NXPI', 'MAR', 'ABNB',
            'MRNA', 'ORLY', 'FTNT', 'CHTR', 'CRWD'
        ]
    }
};

// Sektor-Klassifizierung (vereinfacht)
const SECTOR_ADJUSTMENTS = {
    'Technology': { pegMultiplier: 1.3, peMultiplier: 1.3 },
    'Healthcare': { pegMultiplier: 1.2, peMultiplier: 1.2 },
    'Consumer Cyclical': { pegMultiplier: 1.1, peMultiplier: 1.1 },
    'Communication Services': { pegMultiplier: 1.2, peMultiplier: 1.2 },
    'Financial Services': { pegMultiplier: 0.9, peMultiplier: 0.8, usePB: true },
    'Utilities': { pegMultiplier: 0.8, peMultiplier: 0.8 },
    'Real Estate': { pegMultiplier: 0.9, peMultiplier: 0.9 },
    'Energy': { pegMultiplier: 1.0, peMultiplier: 0.9 },
    'Basic Materials': { pegMultiplier: 1.0, peMultiplier: 0.9 },
    'Industrials': { pegMultiplier: 1.0, peMultiplier: 1.0 },
    'Consumer Defensive': { pegMultiplier: 0.9, peMultiplier: 0.9 }
};

// Kennzahlen-Benchmarks (Durchschnittswerte für Scoring)
const BENCHMARKS = {
    pe: { excellent: 15, good: 20, fair: 25, poor: 30 },
    pb: { excellent: 2, good: 3, fair: 5, poor: 7 },
    peg: { excellent: 1, good: 1.5, fair: 2, poor: 3 },
    profitMargin: { excellent: 20, good: 15, fair: 10, poor: 5 },
    roe: { excellent: 20, good: 15, fair: 10, poor: 5 },
    roa: { excellent: 10, good: 7, fair: 5, poor: 3 },
    debtToEquity: { excellent: 0.5, good: 1.0, fair: 1.5, poor: 2.0 },
    currentRatio: { excellent: 2.0, good: 1.5, fair: 1.0, poor: 0.8 },
    dividendYield: { excellent: 4, good: 3, fair: 2, poor: 1 },
    payoutRatio: { excellent: 50, good: 65, fair: 80, poor: 100 },
    revenueGrowth: { excellent: 15, good: 10, fair: 5, poor: 0 },
    earningsGrowth: { excellent: 15, good: 10, fair: 5, poor: 0 }
};

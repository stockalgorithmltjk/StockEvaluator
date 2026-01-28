# 📊 Börsen-Analysetool

Ein umfassendes Web-basiertes Tool zur Fundamentalanalyse von Aktien mit intelligenter Bewertung und Scoring-System.

## 🎯 Features

### ✅ Implementierte Funktionen

1. **Intelligentes Scoring-System (0-100 Punkte)**
   - Bewertungskennzahlen (25 Punkte): KGV, KBV, PEG-Ratio
   - Profitabilität (25 Punkte): Gewinnmarge, ROE, ROA
   - Finanzielle Stabilität (20 Punkte): Verschuldung, Liquidität
   - Dividenden (15 Punkte): Rendite, Ausschüttungsquote
   - Wachstum (15 Punkte): Umsatz- und Gewinnwachstum

2. **Sub-Scores für detaillierte Analyse**
   - Value Score (Bewertung)
   - Quality Score (Profitabilität)
   - Stability Score (Stabilität)
   - Income Score (Dividende)
   - Growth Score (Wachstum)

3. **Ampelsystem**
   - 🟢 Grün (70-100): Attraktiv / hohes Potenzial
   - 🟡 Gelb (41-69): Durchschnittlich / mit Vorsicht
   - 🔴 Rot (0-40): Nicht empfohlen / hohes Risiko

4. **Watchlist**
   - Unternehmen zur Beobachtung hinzufügen
   - Persistente Speicherung im Browser
   - Schnellzugriff auf gespeicherte Analysen

5. **Index-Analyse**
   - DAX 40
   - S&P 500 (Top 50)
   - NASDAQ 100 (Top 50)
   - Ranking nach Score

6. **Sektor-Adjustierung**
   - Automatische Anpassung der Bewertungskriterien
   - Berücksichtigung branchenspezifischer Besonderheiten

7. **Detaillierte Unternehmensinfos**
   - Basisdaten (Name, Sektor, Land)
   - Finanzkennzahlen
   - Kursinformationen
   - Unternehmensbeschreibung

## 🚀 Schnellstart

### Voraussetzungen
- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)
- Internetverbindung für API-Zugriff

### Installation

1. **Alle Dateien in einen Ordner kopieren:**
   ```
   börsen-analysetool/
   ├── index.html
   ├── styles.css
   ├── config.js
   ├── scoring.js
   ├── api.js
   └── app.js
   ```

2. **index.html im Browser öffnen**
   - Doppelklick auf index.html
   - ODER über lokalen Webserver (empfohlen):
     ```bash
     # Python 3
     python -m http.server 8000
     
     # Node.js (wenn installiert)
     npx http-server
     ```
   - Dann im Browser: http://localhost:8000

### Erste Schritte

1. **Einzelne Aktie analysieren:**
   - Symbol eingeben (z.B. AAPL, MSFT, SAP.DE)
   - "Analysieren" klicken
   - Score und Kennzahlen werden angezeigt

2. **Watchlist nutzen:**
   - Nach Analyse auf "Zur Watchlist hinzufügen" klicken
   - Tab "Watchlist" öffnen
   - Gespeicherte Unternehmen verwalten

3. **Index analysieren:**
   - Tab "Index-Analyse" öffnen
   - Index auswählen (DAX, S&P 500, NASDAQ)
   - "Analysieren" klicken (dauert einige Minuten)

## ⚙️ Konfiguration

### API-Keys einrichten (optional)

Die App nutzt standardmäßig Yahoo Finance (keine API-Keys nötig). Für zusätzliche Datenquellen:

**config.js bearbeiten:**
```javascript
const CONFIG = {
    ALPHA_VANTAGE_KEY: 'DEIN_API_KEY_HIER', // www.alphavantage.co
    USE_YAHOO_FINANCE: true
};
```

**Kostenlose API-Keys:**
- Alpha Vantage: https://www.alphavantage.co/support/#api-key (500 Calls/Tag)
- Financial Modeling Prep: https://financialmodelingprep.com/developer/docs/ (250 Calls/Tag)

### Scoring-Parameter anpassen

In **scoring.js** können Gewichtungen angepasst werden:

```javascript
this.weights = {
    valuation: 25,      // Bewertung
    profitability: 25,  // Profitabilität
    stability: 20,      // Stabilität
    dividend: 15,       // Dividende
    growth: 15          // Wachstum
};
```

## 📊 Scoring-System im Detail

### Bewertungs-Score (25 Punkte)

**KGV (P/E Ratio) - 10 Punkte:**
- < 10: 10 Punkte (sehr günstig)
- 10-15: 8 Punkte (günstig)
- 15-20: 6 Punkte (fair)
- 20-25: 4 Punkte (teuer)
- 25-30: 2 Punkte (sehr teuer)
- > 30: 0 Punkte (überbewertet)

**KBV (P/B Ratio) - 10 Punkte:**
- < 1: 10 Punkte
- 1-2: 8 Punkte
- 2-3: 6 Punkte
- 3-5: 4 Punkte
- 5-7: 2 Punkte

**PEG-Ratio - 5 Punkte:**
- < 1: 5 Punkte (unterbewertet)
- 1-1.5: 4 Punkte
- 1.5-2: 3 Punkte
- 2-2.5: 2 Punkte
- 2.5-3: 1 Punkt

### Profitabilitäts-Score (25 Punkte)

**Gewinnmarge - 10 Punkte:**
- ≥ 20%: 10 Punkte
- ≥ 15%: 8 Punkte
- ≥ 10%: 6 Punkte
- ≥ 5%: 4 Punkte
- ≥ 0%: 2 Punkte

**ROE (Return on Equity) - 10 Punkte:**
- ≥ 20%: 10 Punkte
- ≥ 15%: 8 Punkte
- ≥ 10%: 6 Punkte
- ≥ 5%: 4 Punkte
- > 0%: 2 Punkte

**ROA (Return on Assets) - 5 Punkte:**
- ≥ 10%: 5 Punkte
- ≥ 7%: 4 Punkte
- ≥ 5%: 3 Punkte
- ≥ 3%: 2 Punkte
- > 0%: 1 Punkt

### Stabilitäts-Score (20 Punkte)

**Verschuldungsgrad (Debt to Equity) - 10 Punkte:**
- < 0.5: 10 Punkte
- < 1.0: 8 Punkte
- < 1.5: 6 Punkte
- < 2.0: 4 Punkte
- < 3.0: 2 Punkte

**Current Ratio (Liquidität) - 5 Punkte:**
- ≥ 2.0: 5 Punkte
- ≥ 1.5: 4 Punkte
- ≥ 1.0: 3 Punkte
- ≥ 0.8: 2 Punkte
- > 0: 1 Punkt

**Zinsdeckungsgrad - 5 Punkte:**
- ≥ 10: 5 Punkte
- ≥ 5: 4 Punkte
- ≥ 3: 3 Punkte
- ≥ 2: 2 Punkte
- > 1: 1 Punkt

### Dividenden-Score (15 Punkte)

**Dividendenrendite - 8 Punkte:**
- ≥ 4%: 8 Punkte
- ≥ 3%: 6 Punkte
- ≥ 2%: 4 Punkte
- ≥ 1%: 2 Punkte

**Ausschüttungsquote - 7 Punkte:**
- 30-60%: 7 Punkte (optimal)
- 20-70%: 5 Punkte
- 10-80%: 3 Punkte
- < 100%: 1 Punkt

### Wachstums-Score (15 Punkte)

**Umsatzwachstum (YoY) - 8 Punkte:**
- ≥ 15%: 8 Punkte
- ≥ 10%: 6 Punkte
- ≥ 5%: 4 Punkte
- ≥ 0%: 2 Punkte

**Gewinnwachstum - 7 Punkte:**
- ≥ 15%: 7 Punkte
- ≥ 10%: 5 Punkte
- ≥ 5%: 3 Punkte
- ≥ 0%: 1 Punkt

### Negativ-Filter

Bestimmte Bedingungen limitieren den maximalen Score:

- **Negatives Eigenkapital:** max. 30 Punkte
- **Verschuldung > 200%:** max. 50 Punkte
- **Anhaltende Verluste:** max. 40 Punkte

## 🔍 Symbol-Format

### US-Aktien
- Einfach: `AAPL`, `MSFT`, `GOOGL`

### Deutsche Aktien
- Mit .DE Suffix: `SAP.DE`, `SIE.DE`, `BMW.DE`

### Weitere Märkte
- UK: `.L` (z.B. `BP.L`)
- Frankreich: `.PA` (z.B. `MC.PA`)
- Schweiz: `.SW` (z.B. `NESN.SW`)

## 🛠️ Technische Details

### Architektur
- **Frontend-only:** Reine Client-Side Anwendung
- **Keine Datenbank:** Daten werden im Browser-LocalStorage gespeichert
- **API-Calls:** Direkt an öffentliche Finanz-APIs

### Verwendete APIs
1. **Yahoo Finance** (Primär)
   - Keine Registrierung nötig
   - Umfassende Daten
   - Rate Limits beachten

2. **Alpha Vantage** (Fallback)
   - Kostenloser API Key nötig
   - 500 Calls/Tag
   - Registrierung: https://www.alphavantage.co

### Browser-Kompatibilität
- ✅ Chrome/Edge (88+)
- ✅ Firefox (85+)
- ✅ Safari (14+)
- ✅ Opera (74+)

### Performance
- **Cache:** 5 Minuten pro Symbol
- **Parallel Requests:** 5 gleichzeitig bei Index-Analyse
- **Rate Limiting:** 1 Sekunde Pause zwischen Batches

## 📝 Bekannte Limitierungen

### Aktuelle Einschränkungen:

1. **Keine News/Nachrichten**
   - Würde kostenpflichtige News-API benötigen
   - Kann später ergänzt werden

2. **Keine Insider-Trading Daten**
   - Nicht in kostenlosen APIs verfügbar
   - Spezielle Datenquellen nötig

3. **Keine geografische Umsatzverteilung**
   - Sehr granulare Daten, oft nicht verfügbar
   - Nur bei wenigen Premium-Services

4. **Begrenzte Anteilseigner-Info**
   - Hauptaktionäre manchmal verfügbar
   - Vollständige Daten meist kostenpflichtig

5. **Index-Zusammensetzung**
   - Aktuell fest kodiert (Stand: Januar 2025)
   - Sollte regelmäßig aktualisiert werden

### Workarounds:

- **Fehlende Daten:** Werden als "k.A." (keine Angabe) angezeigt
- **API-Limits:** Cache reduziert wiederholte Anfragen
- **Performance:** Batching bei Index-Analysen

## 🔮 Zukünftige Erweiterungen

### Geplante Features (Vorschlag):

1. **Phase 2:**
   - Export als PDF/Excel
   - Vergleich mehrerer Unternehmen
   - Historische Score-Entwicklung
   - Benachrichtigungen bei Score-Änderungen

2. **Phase 3:**
   - News-Integration (mit API)
   - Charting/Kursverlauf
   - Portfolio-Tracking
   - Screener-Funktion

3. **Phase 4:**
   - Backend mit Datenbank
   - User-Accounts
   - Eigene Scoring-Formeln
   - Backtesting

## 🐛 Troubleshooting

### Problem: "Keine Daten gefunden"
- **Lösung:** Symbol überprüfen (richtige Schreibweise, Suffix für Markt)
- Beispiel: SAP → SAP.DE für deutsche Börse

### Problem: "API Limit erreicht"
- **Lösung:** 
  - 5 Minuten warten (Cache wird verwendet)
  - Eigenen Alpha Vantage Key in config.js eintragen

### Problem: Index-Analyse lädt nicht
- **Lösung:**
  - Geduld: Kann 5-10 Minuten dauern
  - Bei Fehler: Browser-Konsole prüfen (F12)
  - Einzelne Symbole testen

### Problem: Daten veraltet
- **Lösung:**
  - Cache löschen: `financeAPI.clearCache()` in Browser-Konsole
  - Browser-Cache leeren (Strg+Shift+Del)

## 📄 Lizenz & Haftungsausschluss

**Wichtiger Hinweis:**
Dieses Tool dient ausschließlich zu Informations- und Bildungszwecken. 

- ❌ Keine Anlageberatung
- ❌ Keine Garantie für Datenrichtigkeit
- ❌ Keine Haftung für Verluste
- ✅ Nur zur persönlichen Recherche

**Investitionsentscheidungen immer eigenverantwortlich treffen!**

## 👨‍💻 Support & Feedback

Bei Fragen oder Problemen:
1. README durchlesen
2. Browser-Konsole prüfen (F12 → Console)
3. Dokumentation der APIs konsultieren

## 🎓 Weiterführende Ressourcen

- [Yahoo Finance API](https://query2.finance.yahoo.com)
- [Alpha Vantage Docs](https://www.alphavantage.co/documentation/)
- [Fundamental Analysis Basics](https://www.investopedia.com/fundamental-analysis-4689757)

---

**Version:** 1.0  
**Stand:** Januar 2025  
**Status:** MVP (Minimum Viable Product)

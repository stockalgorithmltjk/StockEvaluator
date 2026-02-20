#!/usr/bin/env python3
"""
Lädt Index-Mitglieder von Wikipedia, holt Fundamentaldaten via yfinance,
und schreibt data.json für die statische Web-App (GitHub Pages).
Wird täglich via GitHub Actions ausgeführt.
"""

import json
import time
from datetime import datetime, timezone
from io import StringIO

import yfinance as yf
import pandas as pd
import requests

## ── Helper: Wikipedia mit User-Agent ──

def read_html_with_useragent(url):
    """Lädt HTML von Wikipedia mit korrektem User-Agent"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    return pd.read_html(StringIO(response.text))

def get_sp500():
    """S&P 500 Ticker von Wikipedia"""
    url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
    df = read_html_with_useragent(url)[0]
    tickers = df["Symbol"].tolist()
    return [t.replace(".", "-") for t in tickers][:100]


def get_nasdaq100():
    """NASDAQ 100 Ticker von Wikipedia"""
    url = "https://en.wikipedia.org/wiki/Nasdaq-100"
    for df in read_html_with_useragent(url):
        cols = [str(c).lower() for c in df.columns]
        if "ticker" in cols or "symbol" in cols:
            col_idx = [i for i, c in enumerate(cols) if c in ("ticker", "symbol")][0]
            col = df.columns[col_idx]
            tickers = [str(t).replace(".", "-") for t in df[col].dropna()]
            tickers = [t for t in tickers if t.replace("-","").isalpha()]
            if len(tickers) > 50:
                return tickers[:100]
    raise ValueError("NASDAQ 100 Tabelle nicht gefunden")


def get_dax():
    """DAX Ticker von Wikipedia"""
    url = "https://en.wikipedia.org/wiki/DAX"
    for df in read_html_with_useragent(url):
        cols = [str(c).lower() for c in df.columns]
        if "ticker" in cols or "symbol" in cols:
            col_idx = [i for i, c in enumerate(cols) if c in ("ticker", "symbol")][0]
            col = df.columns[col_idx]
            tickers = [str(t) for t in df[col].dropna() if len(str(t)) > 1]
            if len(tickers) >= 20:
                return [t if "." in t else t + ".DE" for t in tickers][:100]
    raise ValueError("DAX Tabelle nicht gefunden")


def get_ftse100():
    """FTSE 100 Ticker von Wikipedia"""
    url = "https://en.wikipedia.org/wiki/FTSE_100_Index"
    for df in read_html_with_useragent(url):
        cols = [str(c).lower() for c in df.columns]
        if any(k in cols for k in ("ticker", "symbol", "epic")):
            col_idx = [i for i, c in enumerate(cols) if c in ("ticker", "symbol", "epic")][0]
            col = df.columns[col_idx]
            tickers = [str(t).strip() for t in df[col].dropna() if len(str(t)) > 1]
            if len(tickers) >= 50:
                return [t if "." in t else t + ".L" for t in tickers][:100]
    raise ValueError("FTSE 100 Tabelle nicht gefunden")


def get_cac40():
    """CAC 40 Ticker von Wikipedia"""
    url = "https://en.wikipedia.org/wiki/CAC_40"
    for df in read_html_with_useragent(url):
        cols = [str(c).lower() for c in df.columns]
        if "ticker" in cols or "symbol" in cols:
            col_idx = [i for i, c in enumerate(cols) if c in ("ticker", "symbol")][0]
            col = df.columns[col_idx]
            tickers = [str(t).strip() for t in df[col].dropna() if len(str(t)) > 1]
            if len(tickers) >= 20:
                return [t if "." in t else t + ".PA" for t in tickers][:100]
    raise ValueError("CAC 40 Tabelle nicht gefunden")


def get_nikkei225():
    """Nikkei 225 Ticker von Wikipedia"""
    url = "https://en.wikipedia.org/wiki/Nikkei_225"
    for df in read_html_with_useragent(url):
        cols = [str(c).lower() for c in df.columns]
        if any(k in cols for k in ("code", "ticker", "symbol")):
            col_idx = [i for i, c in enumerate(cols) if c in ("code", "ticker", "symbol")][0]
            col = df.columns[col_idx]
            raw = df[col].dropna().tolist()
            tickers = []
            for t in raw:
                s = str(t)
                if s.isdigit():
                    tickers.append(s + ".T")
                elif len(s) > 2:
                    tickers.append(s)
            if len(tickers) >= 50:
                return tickers[:100]
    raise ValueError("Nikkei 225 Tabelle nicht gefunden")


MARKETS = {
    "sp500":  {"name": "S&P 500 – USA",           "fn": get_sp500},
    "nasdaq": {"name": "NASDAQ 100 – Technologie", "fn": get_nasdaq100},
    "dax":    {"name": "DAX – Deutschland",        "fn": get_dax},
    "ftse":   {"name": "FTSE 100 – UK",            "fn": get_ftse100},
    "cac":    {"name": "CAC 40 – Frankreich",      "fn": get_cac40},
    "nikkei": {"name": "Nikkei 225 – Japan",       "fn": get_nikkei225},
}


## ── Scoring ──

def score_stock(info):
    """Berechnet Score und Details für eine Aktie"""
    score = 0
    details = {}
    # KGV (P/E)
    pe = info.get("trailingPE")
    if pe and pe > 0:
        if pe < 15:   s = 25
        elif pe < 20: s = 20
        elif pe < 25: s = 15
        elif pe < 35: s = 10
        elif pe < 50: s = 5
        else:         s = 2
        score += s
        details["pe"] = {"value": round(pe, 2), "score": s, "max": 25}
    # KBV (P/B)
    pb = info.get("priceToBook")
    if pb and pb > 0:
        if pb < 1:   s = 20
        elif pb < 2: s = 16
        elif pb < 4: s = 10
        elif pb < 8: s = 5
        else:        s = 2
        score += s
        details["pb"] = {"value": round(pb, 2), "score": s, "max": 20}
    # ROE
    roe = info.get("returnOnEquity")
    if roe is not None:
        p = roe * 100
        if p > 30:   s = 20
        elif p > 20: s = 16
        elif p > 10: s = 10
        elif p > 0:  s = 5
        else:        s = 0
        score += s
        details["roe"] = {"value": round(p, 1), "score": s, "max": 20}
    # Bruttomarge
    gm = info.get("grossMargins")
    if gm is not None:
        p = gm * 100
        if p > 50:   s = 15
        elif p > 35: s = 12
        elif p > 20: s = 8
        elif p > 10: s = 4
        else:        s = 1
        score += s
        details["grossMargin"] = {"value": round(p, 1), "score": s, "max": 15}
    # Nettomarge
    nm = info.get("profitMargins")
    if nm is not None:
        p = nm * 100
        if p > 20:   s = 10
        elif p > 10: s = 8
        elif p > 5:  s = 5
        elif p > 0:  s = 2
        else:        s = 0
        score += s
        details["netMargin"] = {"value": round(p, 1), "score": s, "max": 10}
    # D/E
    de = info.get("debtToEquity")
    if de is not None:
        if de < 0.3:   s = 10
        elif de < 0.8: s = 8
        elif de < 1.5: s = 5
        elif de < 3:   s = 2
        else:          s = 0
        score += s
        details["debtToEquity"] = {"value": round(de, 2), "score": s, "max": 10}
    # Current Ratio
    cr = info.get("currentRatio")
    if cr is not None:
        if cr > 2:    s = 10
        elif cr > 1.5: s = 8
        elif cr > 1:  s = 5
        elif cr > 0.8: s = 2
        else:         s = 0
        score += s
        details["currentRatio"] = {"value": round(cr, 2), "score": s, "max": 10}
    # Umsatzwachstum
    rg = info.get("revenueGrowth")
    if rg is not None:
        p = rg * 100
        if p > 15:   s = 10
        elif p > 8:  s = 8
        elif p > 3:  s = 5
        elif p > 0:  s = 2
        else:        s = 0
        score += s
        details["revenueGrowth"] = {"value": round(p, 1), "score": s, "max": 10}
    return score, details


## ── Markt abrufen ──

def fetch_market(market_id, cfg):
    """Lädt und scored alle Aktien eines Marktes"""
    print(f"\n=== {cfg['name']} ===")
    try:
        tickers = cfg["fn"]()
        print(f"  {len(tickers)} Ticker von Wikipedia geladen")
    except Exception as e:
        print(f"  ❌ Wikipedia-Abruf fehlgeschlagen: {e}")
        return []
    results = []
    for i, ticker in enumerate(tickers):
        try:
            info  = yf.Ticker(ticker).info
            price = info.get("previousClose") or info.get("regularMarketPreviousClose")
            if not price:
                print(f"  [{i+1}/{len(tickers)}] {ticker} – kein Preis, übersprungen")
                continue
            score, details = score_stock(info)
            def pct(key):
                v = info.get(key)
                return round(v * 100, 2) if v is not None else None
            results.append({
                "symbol":       ticker,
                "name":         info.get("shortName") or info.get("longName") or ticker,
                "price":        price,
                "currency":     info.get("currency", ""),
                "score":        score,
                "scoreDetails": details,
                "metrics": {
                    "pe":            info.get("trailingPE"),
                    "pb":            info.get("priceToBook"),
                    "roe":           pct("returnOnEquity"),
                    "grossMargin":   pct("grossMargins"),
                    "netMargin":     pct("profitMargins"),
                    "debtToEquity":  info.get("debtToEquity"),
                    "currentRatio":  info.get("currentRatio"),
                    "revenueGrowth": pct("revenueGrowth"),
                    "ps":            info.get("priceToSalesTrailing12Months"),
                    "eps":           info.get("trailingEps"),
                    "previousClose": price,
                    "dividendYield": pct("dividendYield"),
                },
            })
            print(f"  [{i+1}/{len(tickers)}] {ticker} – Score {score}")
        except Exception as e:
            print(f"  [{i+1}/{len(tickers)}] {ticker} – Fehler: {e}")
        time.sleep(0.3)
    results.sort(key=lambda x: x["score"], reverse=True)
    print(f"  → {len(results)} Aktien erfolgreich geladen")
    return results


## ── Main ──

def main():
    """Main: Lädt alle Märkte und schreibt data.json"""
    output = {
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "markets": {}
    }
    for market_id, cfg in MARKETS.items():
        stocks = fetch_market(market_id, cfg)
        output["markets"][market_id] = {"name": cfg["name"], "stocks": stocks}
    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"))
    total = sum(len(v["stocks"]) for v in output["markets"].values())
    print(f"\n✅ data.json geschrieben – {total} Aktien gesamt")
    print(f"   Aktualisiert: {output['updated']}")

if __name__ == "__main__":
    main()

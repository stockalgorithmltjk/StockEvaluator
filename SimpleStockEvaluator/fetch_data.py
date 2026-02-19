#!/usr/bin/env python3
"""
Fetches fundamental data for 6 markets × 100 stocks using yfinance.
Outputs data.json for the static GitHub Pages site.
Run via GitHub Actions daily after market close.
"""

import json
import time
from datetime import datetime, timezone

import yfinance as yf

# ── Market definitions ────────────────────────────────────────────────────────
MARKETS = {
    "sp500": {
        "name": "S&P 500 – USA",
        "tickers": [
            "AAPL","MSFT","NVDA","AMZN","META","GOOGL","GOOG","BRK-B","LLY","AVGO",
            "TSLA","JPM","UNH","XOM","V","MA","COST","HD","PG","JNJ",
            "ABBV","BAC","MRK","CVX","KO","WMT","NFLX","CRM","AMD","PEP",
            "TMO","ACN","ORCL","CSCO","ABT","LIN","MCD","DHR","ADBE","TXN",
            "NKE","WFC","NEE","RTX","BMY","T","MS","HON","AMGN","LOW",
            "QCOM","UPS","SBUX","IBM","PM","CAT","ELV","DE","BA","SPGI",
            "PLD","GILD","AXP","BLK","SYK","GE","MDT","AMAT","TJX","GS",
            "VRTX","ADI","ISRG","CB","CI","MMC","MDLZ","PGR","ZTS","REGN",
            "CVS","BKNG","ADP","LRCX","CL","SO","DUK","BDX","AON","SHW",
            "MO","BSX","EQIX","CME","ITW","ETN","HCA","ICE","FI","NOC"
        ]
    },
    "nasdaq": {
        "name": "NASDAQ 100 – Technologie",
        "tickers": [
            "AAPL","MSFT","NVDA","AMZN","META","GOOGL","GOOG","AVGO","TSLA","COST",
            "NFLX","AMD","ADBE","QCOM","PEP","CSCO","TXN","AMGN","HON","INTU",
            "ISRG","AMAT","BKNG","LRCX","ADP","MU","PANW","REGN","VRTX","KLAC",
            "MELI","SNPS","CDNS","CRWD","FTNT","ABNB","KDP","MDLZ","ORLY","PAYX",
            "CTAS","FAST","MNST","ROST","PCAR","IDXX","BIIB","ILMN","DXCM","ZS",
            "TEAM","WDAY","OKTA","DOCU","ZM","SPLK","DDOG","SNOW","NET","COIN",
            "ROKU","TTD","MRNA","SGEN","ALGN","CPRT","SIRI","EBAY","EA","NXPI",
            "MRVL","ON","WBA","DLTR","GEHC","GFS","CCEP","TTWO","ODFL","VRSK",
            "ANSS","CTSH","CDW","FANG","EXC","XTSLA","AZN","CMCSA","PDD","ASML",
            "TMUS","PYPL","INTC","LCID","RIVN","GRAB","JD","BIDU","NTES","WBD"
        ]
    },
    "dax": {
        "name": "DAX – Deutschland",
        "tickers": [
            "SAP.DE","SIE.DE","ALV.DE","MRK.DE","DTE.DE","BAYN.DE","BMW.DE","MBG.DE",
            "DBK.DE","RWE.DE","BAS.DE","EOAN.DE","ADS.DE","VOW3.DE","HEN3.DE","FRE.DE",
            "MTX.DE","SHL.DE","ZAL.DE","IFX.DE","1COV.DE","HNR1.DE","DHER.DE","VNA.DE",
            "CON.DE","ENR.DE","QIA.DE","SY1.DE","WAF.DE","BEI.DE",
            "MAN.DE","HEI.DE","EVT.DE","KGX.DE","LEG.DE","GFK.DE","BOSS.DE","MDO.DE",
            "TUI1.DE","LHA.DE","FME.DE","ARL.DE","CEV.DE","ECV.DE","S92.DE","TAG.DE",
            "SDF.DE","AIXA.DE","EVD.DE","AFX.DE","CWC.DE","TIMA.DE","NEM.DE","PUM.DE",
            "PSM.DE","FNTN.DE","BR3.DE","XONA.DE","BC8.DE","DWNI.DE",
            "HAG.DE","NDA.DE","DBAN.DE","DEQ.DE","MVV1.DE","RAA.DE","GXI.DE","NOEJ.DE",
            "OSR.DE","WUW.DE","EMH.DE","LPKF.DE","NDX1.DE","G1A.DE","DMP.DE","SDAX.DE",
            "H9Y.DE","SZG.DE","MWNG.DE","HLAG.DE","UTDI.DE","PNE.DE","SBS.DE","WTTR.DE",
            "DRW3.DE","HSX.DE","KION.DE","WCHA.DE","IVU.DE","4BS.DE","ENL.DE","SGCG.DE",
            "TOM.DE","T3M.DE","BIO3.DE","NOEJ.DE","VBKP.DE","RHM.DE","FPE3.DE","GLJ.DE"
        ]
    },
    "ftse": {
        "name": "FTSE 100 – UK",
        "tickers": [
            "SHEL.L","AZN.L","HSBA.L","ULVR.L","BP.L","RIO.L","GSK.L","REL.L","BATS.L","DGE.L",
            "NG.L","NWG.L","LLOY.L","LSEG.L","VOD.L","GLEN.L","PRU.L","EXPN.L","RKT.L","WPP.L",
            "CPG.L","SPX.L","MNDI.L","INF.L","STJ.L","BA.L","BT.L","IHG.L","OCDO.L","SGRO.L",
            "AAL.L","AUTO.L","BNZL.L","CCH.L","CNA.L","CRDA.L","FLTR.L","HLN.L","III.L","IMB.L",
            "ITV.L","JD.L","JMAT.L","KGF.L","LAND.L","LGEN.L","MKS.L","MONY.L","MRO.L","MTO.L",
            "NXT.L","PHNX.L","PSH.L","PSON.L","RMV.L","RR.L","SBRY.L","SDR.L","SKG.L","SMDS.L",
            "SMIN.L","SMT.L","SN.L","SVT.L","TSCO.L","TW.L","WEIR.L","WTB.L","ABF.L","ADM.L",
            "AHT.L","ANTO.L","AVV.L","BKG.L","BME.L","BRBY.L","BWY.L","CCL.L","DCC.L","DLN.L",
            "EZJ.L","FCIT.L","FRES.L","GAW.L","GNRC.L","HIK.L","HMN.L","HOC.L","HSV.L","IAG.L",
            "ICG.L","IPO.L","JE.L","KIE.L","MCRO.L","MGNS.L","MSLH.L","OML.L","OPHR.L","PCG.L"
        ]
    },
    "cac": {
        "name": "CAC 40 – Frankreich",
        "tickers": [
            "MC.PA","OR.PA","TTE.PA","SAN.PA","AI.PA","BNP.PA","SU.PA","AIR.PA","RI.PA","RMS.PA",
            "EL.PA","DG.PA","ACA.PA","SGO.PA","CS.PA","KER.PA","CAP.PA","GLE.PA","LR.PA","VIE.PA",
            "SAF.PA","HO.PA","STLAM.MI","WLN.PA","DSY.PA","ORA.PA","STM.PA","EN.PA","ENGI.PA","MT.AS",
            "STLA.PA","AF.PA","ALO.PA","ATO.PA","BEN.PA","BOL.PA","CA.PA","CI.PA","COFA.PA","CRH.PA",
            "DBG.PA","EDEN.PA","ERF.PA","EDF.PA","ELIS.PA","ETL.PA","EUCAR.PA","FDR.PA","FTI.PA","GTT.PA",
            "HAVAS.PA","HO.PA","IDP.PA","IFNL.PA","INVE.PA","IPH.PA","ISS.PA","JCAUX.PA","KEY.PA","LACR.PA",
            "LANC.PA","LDC.PA","LI.PA","LNA.PA","LOUP.PA","LPE.PA","LR.PA","LU.PA","LUXA.PA","LVMH.PA",
            "MAAT.PA","MAU.PA","MEDCL.PA","MERY.PA","MF.PA","MLGF.PA","MRN.PA","NREX.PA","NSN.PA","NXI.PA",
            "OPT.PA","OSE.PA","PHA.PA","POM.PA","PTON.PA","QDT.PA","RBAL.PA","ROAI.PA","RXL.PA","SAC.PA",
            "SCBSM.PA","SES.PA","SFT.PA","SFOR.PA","SLB.PA","SOP.PA","SPEL.PA","SRP.PA","STF.PA","TKT.PA"
        ]
    },
    "nikkei": {
        "name": "Nikkei 225 – Japan",
        "tickers": [
            "7203.T","9984.T","6758.T","8306.T","8316.T","7267.T","6861.T","7974.T","9433.T","8411.T",
            "6098.T","4568.T","7751.T","9432.T","8058.T","7741.T","6367.T","4519.T","8031.T","9022.T",
            "6954.T","4661.T","7269.T","8035.T","6501.T","4543.T","5108.T","2914.T","6902.T","7832.T",
            "4502.T","8802.T","6702.T","4901.T","9020.T","5401.T","1925.T","6503.T","8766.T","7011.T",
            "9021.T","4307.T","8604.T","9064.T","6645.T","9008.T","4452.T","6857.T","3382.T","9007.T",
            "8001.T","9101.T","8801.T","6326.T","5020.T","1928.T","7270.T","7201.T","6471.T","1803.T",
            "4004.T","9009.T","8309.T","4063.T","7733.T","2501.T","3407.T","6981.T","4911.T","8750.T",
            "5711.T","3436.T","5233.T","7735.T","8830.T","6752.T","5332.T","7912.T","1605.T","3289.T",
            "4324.T","6988.T","6770.T","7762.T","4005.T","3105.T","1332.T","4042.T","3863.T","5706.T",
            "1812.T","8015.T","5012.T","4151.T","5703.T","3401.T","4183.T","6302.T","5631.T","8267.T"
        ]
    }
}

METRICS_FIELDS = [
    "trailingPE", "priceToBook", "returnOnEquity", "grossMargins",
    "profitMargins", "debtToEquity", "currentRatio", "revenueGrowth",
    "priceToSalesTrailing12Months", "trailingEps", "previousClose", "dividendYield"
]


def score_stock(info):
    score = 0
    details = {}

    # KGV (P/E) – max 25
    pe = info.get("trailingPE")
    if pe and pe > 0:
        if pe < 15: s = 25
        elif pe < 20: s = 20
        elif pe < 25: s = 15
        elif pe < 35: s = 10
        elif pe < 50: s = 5
        else: s = 2
        score += s
        details["pe"] = {"value": round(pe, 2), "score": s, "max": 25}

    # KBV (P/B) – max 20
    pb = info.get("priceToBook")
    if pb and pb > 0:
        if pb < 1: s = 20
        elif pb < 2: s = 16
        elif pb < 4: s = 10
        elif pb < 8: s = 5
        else: s = 2
        score += s
        details["pb"] = {"value": round(pb, 2), "score": s, "max": 20}

    # ROE – max 20
    roe = info.get("returnOnEquity")
    if roe is not None:
        roe_pct = roe * 100
        if roe_pct > 30: s = 20
        elif roe_pct > 20: s = 16
        elif roe_pct > 10: s = 10
        elif roe_pct > 0: s = 5
        else: s = 0
        score += s
        details["roe"] = {"value": round(roe_pct, 1), "score": s, "max": 20}

    # Bruttomarge – max 15
    gm = info.get("grossMargins")
    if gm is not None:
        gm_pct = gm * 100
        if gm_pct > 50: s = 15
        elif gm_pct > 35: s = 12
        elif gm_pct > 20: s = 8
        elif gm_pct > 10: s = 4
        else: s = 1
        score += s
        details["grossMargin"] = {"value": round(gm_pct, 1), "score": s, "max": 15}

    # Nettomarge – max 10
    nm = info.get("profitMargins")
    if nm is not None:
        nm_pct = nm * 100
        if nm_pct > 20: s = 10
        elif nm_pct > 10: s = 8
        elif nm_pct > 5: s = 5
        elif nm_pct > 0: s = 2
        else: s = 0
        score += s
        details["netMargin"] = {"value": round(nm_pct, 1), "score": s, "max": 10}

    # D/E – max 10
    de = info.get("debtToEquity")
    if de is not None:
        if de < 0.3: s = 10
        elif de < 0.8: s = 8
        elif de < 1.5: s = 5
        elif de < 3: s = 2
        else: s = 0
        score += s
        details["debtToEquity"] = {"value": round(de, 2), "score": s, "max": 10}

    # Current Ratio – max 10
    cr = info.get("currentRatio")
    if cr is not None:
        if cr > 2: s = 10
        elif cr > 1.5: s = 8
        elif cr > 1: s = 5
        elif cr > 0.8: s = 2
        else: s = 0
        score += s
        details["currentRatio"] = {"value": round(cr, 2), "score": s, "max": 10}

    # Umsatzwachstum – max 10
    rg = info.get("revenueGrowth")
    if rg is not None:
        rg_pct = rg * 100
        if rg_pct > 15: s = 10
        elif rg_pct > 8: s = 8
        elif rg_pct > 3: s = 5
        elif rg_pct > 0: s = 2
        else: s = 0
        score += s
        details["revenueGrowth"] = {"value": round(rg_pct, 1), "score": s, "max": 10}

    return score, details


def fetch_market(market_id, market_cfg):
    results = []
    tickers = market_cfg["tickers"]
    print(f"  Fetching {len(tickers)} tickers for {market_id}...")

    for i, ticker in enumerate(tickers):
        try:
            t = yf.Ticker(ticker)
            info = t.info

            # Skip if no price data
            price = info.get("previousClose") or info.get("regularMarketPreviousClose")
            if not price:
                print(f"    [{i+1}/{len(tickers)}] {ticker} – no price, skip")
                continue

            score, details = score_stock(info)

            results.append({
                "symbol": ticker,
                "name": info.get("shortName") or info.get("longName") or ticker,
                "price": price,
                "currency": info.get("currency", ""),
                "score": score,
                "metrics": {
                    "pe":            info.get("trailingPE"),
                    "pb":            info.get("priceToBook"),
                    "roe":           round(info.get("returnOnEquity", 0) * 100, 2) if info.get("returnOnEquity") is not None else None,
                    "grossMargin":   round(info.get("grossMargins", 0) * 100, 2) if info.get("grossMargins") is not None else None,
                    "netMargin":     round(info.get("profitMargins", 0) * 100, 2) if info.get("profitMargins") is not None else None,
                    "debtToEquity":  info.get("debtToEquity"),
                    "currentRatio":  info.get("currentRatio"),
                    "revenueGrowth": round(info.get("revenueGrowth", 0) * 100, 2) if info.get("revenueGrowth") is not None else None,
                    "ps":            info.get("priceToSalesTrailing12Months"),
                    "eps":           info.get("trailingEps"),
                    "previousClose": price,
                    "dividendYield": round(info.get("dividendYield", 0) * 100, 2) if info.get("dividendYield") is not None else None,
                },
                "scoreDetails": details,
            })
            print(f"    [{i+1}/{len(tickers)}] {ticker} – score {score}")

        except Exception as e:
            print(f"    [{i+1}/{len(tickers)}] {ticker} – error: {e}")

        # Polite delay to avoid rate-limiting
        time.sleep(0.3)

    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    return results


def main():
    output = {
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "markets": {}
    }

    for market_id, market_cfg in MARKETS.items():
        print(f"\n=== {market_cfg['name']} ===")
        stocks = fetch_market(market_id, market_cfg)
        output["markets"][market_id] = {
            "name": market_cfg["name"],
            "stocks": stocks
        }
        print(f"  → {len(stocks)} stocks fetched")

    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

    print(f"\n✅ data.json written with {sum(len(v['stocks']) for v in output['markets'].values())} total stocks")
    print(f"   Updated: {output['updated']}")


if __name__ == "__main__":
    main()

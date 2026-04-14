import yfinance as yf
import pandas as pd
import numpy as np
from indicators import add_indicators

def clean_val(val):
    """NumPy型や異常値をPython標準のfloat/Noneに変換する"""
    if val is None or pd.isna(val) or val == float('inf') or val == float('-inf'):
        return None
    return round(float(val), 2)

def fetch_stock_info(symbol: str, timeframe: str = "1w"):
    clean_symbol = symbol.strip().upper()
    ticker = yf.Ticker(clean_symbol)
    
    # 1. チャートデータの取得（計算用のバッファを含めて長めに取得）
    tf_map = {
        "5m":  {"p": "5d",   "i": "5m"},   # 1日分表示だが5日分取得
        "1d":  {"p": "1mo",  "i": "30m"},  # 5日分表示だが1ヶ月分取得
        "1w":  {"p": "1y",   "i": "1d"},   # 1ヶ月分表示だが1年分取得
        "1mo": {"p": "max",  "i": "1wk"}   # 1年分表示だが全期間取得
    }
    conf = tf_map.get(timeframe, tf_map["1w"])
    hist = ticker.history(period=conf["p"], interval=conf["i"])
    
    if hist.empty:
        return None

    # テクニカル指標（MA5, MA25, MA75等）の計算
    hist = add_indicators(hist)

    # ✅ 【重要】ノイズ除去：計算が終わった後、表示に必要な直近データだけを切り出す
    # これにより、データの最初の方にある「MA75が計算できていないnull期間」を排除します
    display_counts = {
        "5m": 78,   # 約1日分 (6.5時間分)
        "1d": 60,   # 約1週間分
        "1w": 30,   # 約1ヶ月分
        "1mo": 24   # 約2年分
    }
    count = display_counts.get(timeframe, 50)
    hist = hist.tail(count) # 直近の「綺麗なデータ」だけを残す

    # 2. 現在価格と前日比の特定
    info = ticker.info
    try:
        current_price = ticker.fast_info.get('last_price')
    except:
        current_price = info.get('currentPrice') or hist['Close'].iloc[-1]

    if current_price is None:
        current_price = hist['Close'].iloc[-1]

    prev_close = info.get('previousClose') or (hist['Close'].iloc[-2] if len(hist) > 1 else current_price)
    
    change = current_price - prev_close
    raw_percent = (change / prev_close) * 100 if prev_close != 0 else 0

    # 3. ファンダメンタルズ取得（エラーハンドリング強化）
    pbr = info.get('priceToBook')
    roe = (info.get('returnOnEquity') or 0) * 100
    margin = (info.get('operatingMargins') or 0) * 100
    raw_yield = info.get('dividendYield') or 0
    div_yield = raw_yield if raw_yield > 0.5 else raw_yield * 100

    # 4. チャートデータの整形
    chart_data = []
    for date, row in hist.iterrows():
        chart_data.append({
            "date": date.strftime('%m/%d %H:%M') if timeframe in ["5m", "1d"] else date.strftime('%m/%d'),
            "price": clean_val(row['Close']),
            "ma5": clean_val(row.get('ma5')),
            "ma25": clean_val(row.get('ma25')),
            "ma75": clean_val(row.get('ma75')),
            "rsi": clean_val(row.get('rsi')),
            "macd": clean_val(row.get('macd')),
            "macd_signal": clean_val(row.get('macd_signal')),
            "macd_hist": clean_val(row.get('macd_hist')),
            "bb_upper": clean_val(row.get('bb_up')),
            "bb_lower": clean_val(row.get('bb_down')),
            "volume": clean_val(row.get('Volume')),
        })

    # 5. 返り値の構成
    return {
        "symbol": symbol,
        "name": info.get('longName') or info.get('shortName'),
        "sector": info.get('sector'),
        "price": clean_val(current_price),
        "percent": f"{raw_percent:+.2f}%",
        "isPositive": bool(raw_percent >= 0), # NumPy型回避
        "currency": info.get('currency', 'JPY'),
        "chartData": chart_data,
        "marketCap": info.get('marketCap'),
        "roe": clean_val(roe),
        "margin": clean_val(margin),
        "pbr": clean_val(pbr),
        "dividendYield": clean_val(div_yield),
        "totalRevenue": info.get('totalRevenue'),
        "netIncome": info.get('netIncomeToCommon') or info.get('netIncome')
    }

def extract_financials(info):
    """スクリーニング一括取得用の計算ロジック"""
    def s(key, default=0): 
        val = info.get(key)
        return val if val is not None else default

    pbr = s('priceToBook')
    per = s('forwardPE') or s('trailingPE')
    ev_ebitda = s('enterpriseToEbitda')
    rev_growth = s('revenueGrowth') * 100
    eps_growth = s('earningsGrowth') * 100
    peg = s('pegRatio')
    roe = s('returnOnEquity') * 100
    op_margin = s('operatingMargins') * 100
    roic = s('returnOnAssets') * 100 
    equity_ratio = (1 / s('debtToEquity', 1)) * 100 if s('debtToEquity') else 0
    de_ratio = s('debtToEquity')
    icr = 999 if s('earningsBeforeITandA', 0) > 0 and s('interestExpense', 0) == 0 else s('earningsBeforeITandA', 0) / max(s('interestExpense', 1), 1)
    div_yield = s('dividendYield') * 100
    payout = s('dividendPayoutRatio') * 100
    current = s('currentPrice') or s('previousClose')
    high_52 = s('fiftyTwoWeekHigh', 1)
    high_52wk_diff = ((current / high_52) - 1) * 100

    return {
        "per": per, "pbr": pbr, "ev_ebitda": ev_ebitda,
        "rev_growth": rev_growth, "eps_growth": eps_growth, "peg_ratio": peg,
        "roe": roe, "op_margin": op_margin, "roic": roic,
        "equity_ratio": equity_ratio, "de_ratio": de_ratio, "icr": icr,
        "dividend_yield": div_yield, "payout_ratio": payout,
        "high_52wk_diff": high_52wk_diff,
        "market_cap": s('marketCap')
    }
# backend/stock_service.py
import yfinance as yf
import pandas as pd
from indicators import add_indicators

def fetch_stock_info(symbol: str, timeframe: str = "1w"):
    clean_symbol = symbol.strip().upper()
    ticker = yf.Ticker(clean_symbol)
    
    tf_map = {
    # 期間(p)と、点の間隔(i)の組み合わせ
    "5m":  {"p": "1d",  "i": "5m"},   # 今日1日を5分刻みで（非常に細かい）
    "1d":  {"p": "5d",  "i": "30m"},  # 直近5日間を30分刻みで
    "1w":  {"p": "1mo", "i": "1d"},   # 直近1ヶ月を1日刻みで
    "1mo": {"p": "1y",  "i": "1d"}    # 直近1年を1日刻みで（非常に長い線になる）
}
    conf = tf_map.get(timeframe, tf_map["1w"])
    
    hist = ticker.history(period=conf["p"], interval=conf["i"])
    if hist.empty:
        return None

    # 指標の計算
    hist = add_indicators(hist)

    # ✅ JSONのNaNエラーを防ぐためのクリーンアップ関数
    def clean_val(val):
        # pd.isna は NaN や None を判定してくれる
        if pd.isna(val) or val == float('inf') or val == float('-inf'):
            return None
        return round(float(val), 2)

    chart_data = []
    for date, row in hist.iterrows():
        chart_data.append({
            "date": date.strftime('%m/%d %H:%M') if timeframe == "5m" else date.strftime('%m/%d'),
            "price": clean_val(row['Close']),
            "ma5": clean_val(row.get('ma5')),
            "ma25": clean_val(row.get('ma25')),
            "rsi": clean_val(row.get('rsi')),
        })

    # 最新データの取得
    current_price = hist['Close'].iloc[-1]
    prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
    change = current_price - prev_close
    
    # 騰落率の計算
    raw_percent = (change / prev_close) * 100 if prev_close != 0 else 0
    
    return {
        "symbol": clean_symbol,
        "price": clean_val(current_price),
        "change": clean_val(change),
        "percent": f"{clean_val(raw_percent)}%",
        "chartData": chart_data,
        "isPositive": bool(change >= 0) if pd.notna(change) else True
    }
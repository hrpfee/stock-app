from fastapi import FastAPI, HTTPException, Query, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
from typing import Optional, List, Dict
from database import get_db_connection
from stock_service import fetch_stock_info
from search_service import search_ticker

app = FastAPI()

# ✅ CORS設定：127.0.0.1も追加して通信をより安定させる
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1️⃣ 個別銘柄 & 検索 ---

@app.get("/api/stock/{symbol}")
def get_stock(symbol: str, timeframe: str = "1d"):
    result = fetch_stock_info(symbol, timeframe)
    if not result:
        raise HTTPException(status_code=404, detail="Stock not found")
    return result

@app.get("/api/search")
def get_search_results(q: str, market: str = "US"):
    return search_ticker(q, market)

# --- 2️⃣ ニュース取得（超頑丈版） ---

@app.get("/api/market-news")
def get_market_news(market: str = "JP"):
    # 市場に応じた監視銘柄（ここからニュースを引っ張る）
    symbols = ["^N225", "7203.T", "8316.T"] if market == "JP" else ["^GSPC", "AAPL", "NVDA", "TSLA"]
    all_news = []
    processed_titles = set()

    for sym in symbols:
        try:
            ticker = yf.Ticker(sym)
            yf_news = ticker.news
            if not yf_news: continue

            for item in yf_news:
                # ✅ 構造の変化に対応：content階層がある場合とない場合の両方をチェック
                content = item.get("content", item) 
                
                title = content.get("title")
                # タイトルがない、または重複している場合はスキップ
                if not title or title in processed_titles: continue

                # 🔗 リンクの取得（複数のキー候補をチェック）
                link = content.get("canonicalUrl", {}).get("url") or \
                       content.get("clickThroughUrl", {}).get("url") or \
                       content.get("link")

                # 🖼️ サムネイルの取得
                thumb = None
                thumbnail_data = content.get("thumbnail", {})
                if thumbnail_data:
                    resolutions = thumbnail_data.get("resolutions", [])
                    if resolutions:
                        thumb = resolutions[0].get("url")

                all_news.append({
                    "title": title,
                    "publisher": content.get("provider", {}).get("displayName") or content.get("publisher") or "Yahoo Finance",
                    "link": link,
                    "time_str": content.get("pubDate") or content.get("provider_publish_time"),
                    "related": sym,
                    "thumbnail": thumb
                })
                processed_titles.add(title)
                
        except Exception as e:
            print(f"⚠️ News Error for {sym}: {e}")

    # 最大15件を返す
    return all_news[:15]

# --- 3️⃣ 決算日程（サンプル） ---

@app.get("/api/earnings-calendar")
def get_earnings_calendar():
    return [
        {"symbol": "7203.T", "name": "トヨタ", "date": "2026-05-08"},
        {"symbol": "8316.T", "name": "三井住友FG", "date": "2026-05-14"},
        {"symbol": "AAPL", "name": "Apple", "date": "2026-05-01"},
        {"symbol": "NVDA", "name": "NVIDIA", "date": "2026-05-22"},
    ]

# --- 4️⃣ スクリーニング：動的クエリ・エンジン ---

@app.get("/api/screener")
def get_screening_results(request: Request):
    params = dict(request.query_params)
    market = params.get("market", "JP")
    sector = params.get("sector")
    # ✅ ソート項目を動的に受け取れるようにする（デフォルトは時価総額）
    sort_by = params.get("sort_by", "market_cap") 
    order = params.get("order", "DESC")

    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM stocks WHERE 1=1"
    sql_params = []

    # 市場フィルター
    if market == "JP": query += " AND symbol LIKE '%.T'"
    elif market == "US": query += " AND symbol NOT LIKE '%.T'"

    # ✅ 業種フィルター（LIKEを使って部分一致にする）
    if sector and sector != "":
        query += " AND sector LIKE ?"
        sql_params.append(f"%{sector}%")

    # 数値範囲フィルター
    target_columns = ["per", "pbr", "roe", "op_margin", "dividend_yield", "market_cap"]
    for col in target_columns:
        min_v = params.get(f"{col}_min")
        max_v = params.get(f"{col}_max")
        if min_v:
            query += f" AND {col} >= ?"
            sql_params.append(float(min_v))
        if max_v:
            query += f" AND {col} <= ?"
            sql_params.append(float(max_v))

    # ✅ ソート順を時価総額やROEに変更可能にする
    # (SQLインジェクション対策として直接埋め込まず、ホワイトリストでチェック)
    valid_sort_cols = ["market_cap", "roe", "per", "pbr", "dividend_yield"]
    if sort_by not in valid_sort_cols: sort_by = "market_cap"
    
    query += f" ORDER BY {sort_by} {order}"

    cursor.execute(query, sql_params)
    results = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return results
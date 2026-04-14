# backend/search_service.py
import requests

def search_ticker(query: str, market: str = "US"):
    if not query: return []
    
    # 日本語検索には query2 が最も安定しています
    url = "https://query2.finance.yahoo.com/v1/finance/search"
    
    params = {
        'q': query,
        'quotesCount': 10,
        'newsCount': 0,
        'lang': 'ja-JP', # 日本語を優先
        'region': 'JP'   # 日本市場を優先
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Referer": "https://finance.yahoo.com/"
    }

    try:
        response = requests.get(url, params=params, headers=headers, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        raw_quotes = data.get("quotes", [])
        candidates = []

        # 1. APIが見つけた実在する銘柄のみを処理
        for quote in raw_quotes:
            if quote.get("quoteType") in ["EQUITY", "ETF"]:
                symbol = quote.get("symbol", "")
                name = quote.get("shortname") or quote.get("longname") or symbol
                exch = quote.get("exchange", "")

                # 市場スコアリング
                score = 0
                is_jp = symbol.endswith(".T") or exch in ["TYO", "OSA"]
                if market == "JP" and is_jp: score = 500
                elif market == "US" and not is_jp: score = 500

                candidates.append({
                    "symbol": symbol,
                    "name": name,
                    "exch": exch,
                    "score": score
                })

        # 2. 数字4桁の直接入力があった場合も、API結果に「その番号が含まれているか」で実在を確認する
        # （APIを介さずに勝手に候補を作るのをやめます）

        # スコア順にソート
        candidates.sort(key=lambda x: x["score"], reverse=True)
        return candidates

    except Exception as e:
        print(f"DEBUG: Search API Error: {e}")
        return []
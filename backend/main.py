# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
# ✅ 自作したファイルをインポート！
from stock_service import fetch_stock_info

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/stock/{symbol}")
# ✅ 引数に timeframe: str = "1w" を追加（これでURLの ?timeframe= を受け取れる）
def get_stock(symbol: str, timeframe: str = "1w"):
    print(f"DEBUG: 銘柄={symbol}, 期間={timeframe} でリクエストを受け付けました") 
    
    # ✅ 取得した timeframe を fetch_stock_info に渡す！
    result = fetch_stock_info(symbol, timeframe)
    
    if not result:
        raise HTTPException(status_code=404, detail="Stock not found")
    return result
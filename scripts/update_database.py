# scripts/update_database.py
import sys
import os
import time
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.database import get_db_connection
from backend.stock_service import fetch_stock_info

def update_all_stocks():
    # テスト銘柄（順次増やせます）
    symbols = ["7203.T", "8306.T", "8316.T", "9984.T", "9432.T", "6758.T", "4063.T", "8035.T"]
    
    conn = get_db_connection()
    cursor = conn.cursor()

    for sym in symbols:
        try:
            print(f"Fetching {sym}...", end="", flush=True)
            data = fetch_stock_info(sym)
            if not data: continue

            cursor.execute('''
                INSERT OR REPLACE INTO stocks 
                (symbol, name, sector, market_cap, roe, op_margin, pbr, dividend_yield, equity_ratio, revenue, net_profit)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data['symbol'], data['name'], data['sector'],
                data.get('marketCap'), data['roe'], data['margin'], data['pbr'],
                data['dividendYield'], data.get('equityRatio'),
                data.get('totalRevenue'), data.get('netIncome')
            ))
            conn.commit()
            print(" ✅")
            time.sleep(1) # Yahoo!負荷対策
        except Exception as e:
            print(f" ❌ {e}")

    conn.close()
    print("✨ インポート完了。")

if __name__ == "__main__":
    update_all_stocks()
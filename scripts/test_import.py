# scripts/test_import.py
import sys
import os
import time

# パス設定
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
sys.path.append(ROOT_DIR)
sys.path.append(os.path.join(ROOT_DIR, 'backend'))

from backend.database import get_db_connection
from backend.stock_service import fetch_stock_info

# ✅ 数値クリーニング用関数
def clean_num(val):
    if val is None or val == "---": return None
    if isinstance(val, str):
        # "%" や "," を除去して数値化
        val = val.replace('%', '').replace(',', '').strip()
    try:
        return float(val)
    except ValueError:
        return None

def test_import():
    test_symbols = ["7203.T", "8306.T", "8316.T", "9984.T", "9432.T"]
    
    conn = get_db_connection()
    cursor = conn.cursor()

    print(f"--- インポート開始: {len(test_symbols)}件 ---")
    
    for symbol in test_symbols:
        try:
            print(f"[{symbol}] 取得中...", end="", flush=True)
            data = fetch_stock_info(symbol)
            
            if data:
                # ✅ 保存前にすべての数値を float に変換
                cursor.execute('''
                    INSERT OR REPLACE INTO stocks 
                    (symbol, name, sector, market_cap, roe, op_margin, pbr, dividend_yield, equity_ratio, revenue, net_profit)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    data['symbol'],
                    data['name'],
                    data['sector'],
                    clean_num(data.get('marketCap')),
                    clean_num(data['roe']),
                    clean_num(data['margin']),
                    clean_num(data['pbr']),
                    clean_num(data['dividendYield']),
                    clean_num(data.get('equityRatio')),
                    clean_num(data.get('totalRevenue')),
                    clean_num(data.get('netIncome'))
                ))
                conn.commit()
                print(f" ✅ 保存完了 ({data['name']})")
            else:
                print(" ❌ データ取得失敗")
            
            time.sleep(1)
        except Exception as e:
            print(f" ⚠️ エラー: {e}")

    conn.close()
    print("--- 全ての処理が終了しました ---")

if __name__ == "__main__":
    test_import()
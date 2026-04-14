import sys
import os
import time
import sqlite3

# パス設定
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
sys.path.append(ROOT_DIR)
sys.path.append(os.path.join(ROOT_DIR, 'backend'))

from backend.stock_service import fetch_stock_info, extract_financials
from backend.database import get_db_connection

def import_stocks(symbols):
    conn = get_db_connection()
    cursor = conn.cursor()

    print(f"🚀 インポート開始: 合計 {len(symbols)} 銘柄")
    
    for i, symbol in enumerate(symbols):
        try:
            print(f"[{i+1}/{len(symbols)}] {symbol} を解析中...", end="", flush=True)
            
            # 1. yfinanceから詳細データを取得
            # fetch_stock_info 内で既にテクニカルやinfoを取得済み
            data = fetch_stock_info(symbol)
            
            if not data:
                print(" ❌ データなし")
                continue

            # 2. データベースへ保存 (SQL文はsetup_dbの定義に合わせる)
            # 全指標を INSERT OR REPLACE で流し込む
            cursor.execute('''
                INSERT OR REPLACE INTO stocks (
                    symbol, name, sector, market_cap,
                    per, pbr, roe, op_margin, dividend_yield,
                    equity_ratio, rev_growth, eps_growth, high_52wk_diff
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data['symbol'], data['name'], data['sector'], data['marketCap'],
                data.get('per'), data['pbr'], data['roe'], data['margin'], data['dividendYield'],
                data.get('equity_ratio'), data.get('rev_growth'), data.get('eps_growth'), data.get('high_52wk_diff')
            ))
            
            conn.commit()
            print(f" ✅ 完了 ({data['name']})")

            # ⚠️ 重要: Yahoo! Financeからブロックされないように休憩を入れる
            # 数千件やる場合は 1〜2秒 は必須
            time.sleep(1.5)

        except Exception as e:
            print(f" ⚠️ エラー: {symbol} - {e}")
            continue

    conn.close()
    print("--- すべての処理が終了しました ---")

if __name__ == "__main__":
    # テストとして主要銘柄を多めにセット
    # 本番はここを JPX の全銘柄リストなどを読み込む形にする
    target_list = [
        "7203.T", "8306.T", "9984.T", "9432.T", "6758.T", # 日本株主要
        "AAPL", "NVDA", "TSLA", "MSFT", "GOOGL", "AMZN",  # 米国株主要
        "8035.T", "4063.T", "6857.T", "6501.T"            # 半導体・重電
    ]
    import_stocks(target_list)
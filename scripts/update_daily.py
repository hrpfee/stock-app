import sys
import os
import time

# 1️⃣ プロジェクトのルートディレクトリを取得
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# 2️⃣ ルートディレクトリと backend ディレクトリの両方をパスに追加
sys.path.append(root_path)
sys.path.append(os.path.join(root_path, 'backend')) # ✅ これを追加！

# その後にインポート
from backend.stock_service import fetch_stock_info, extract_financials
from backend.database import get_db_connection
import yfinance as yf

def update_metrics(limit=300): # 🚀 最初は300件くらいで回すのが安全
    conn = get_db_connection()
    cursor = conn.cursor()

    # 🕒 更新が古いもの（または一度も更新されていないもの）から取得
    cursor.execute("SELECT symbol FROM stocks ORDER BY updated_at ASC LIMIT ?", (limit,))
    targets = [row['symbol'] for row in cursor.fetchall()]

    if not targets:
        print("✅ 全銘柄の更新が完了しています。")
        return

    print(f"🔄 今回の更新対象: {len(targets)} 銘柄")

    for i, sym in enumerate(targets):
        try:
            print(f"[{i+1}/{len(targets)}] {sym} を取得中...", end="", flush=True)
            
            ticker = yf.Ticker(sym)
            info = ticker.info
            
            if not info or 'longName' not in info:
                print(" ❌ データなし (スキップ)")
                # 更新したことにしないと永遠にリストの先頭に残るので、タイムスタンプだけ更新
                cursor.execute("UPDATE stocks SET updated_at = CURRENT_TIMESTAMP WHERE symbol = ?", (sym,))
                conn.commit()
                continue

            # 財務指標を抽出
            metrics = extract_financials(info)
            
            # DBを更新
            cursor.execute('''
                UPDATE stocks SET 
                    name = ?, 
                    sector = ?, 
                    per = ?, 
                    pbr = ?, 
                    roe = ?, 
                    op_margin = ?, 
                    market_cap = ?, 
                    dividend_yield = ?,
                    high_52wk_diff = ?, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE symbol = ?
            ''', (
                info.get('longName'), 
                info.get('sector'),
                metrics.get('per'), 
                metrics.get('pbr'), 
                metrics.get('roe'),
                metrics.get('op_margin'), 
                metrics.get('market_cap'), 
                metrics.get('dividend_yield'),
                metrics.get('high_52wk_diff'), 
                sym
            ))
            
            conn.commit()
            print(f" ✅ 完了 ({info.get('shortName')})")

            # ⚠️ 重要: BAN回避のための休憩 (1.5秒)
            time.sleep(1.5)

        except Exception as e:
            print(f" ⚠️ エラー: {sym} - {e}")
            continue

    conn.close()
    print("\n--- 本日のバッチ更新が終了しました ---")

if __name__ == "__main__":
    update_metrics()
import sqlite3
import os

# DBの場所を特定
db_path = os.path.join(os.path.dirname(__file__), '../backend/stocks.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 全データを取得
cursor.execute("SELECT symbol, name, sector FROM stocks")
rows = cursor.fetchall()

print(f"--- DB確認結果: 合計 {len(rows)} 件 ---")
for row in rows:
    print(row)

conn.close()
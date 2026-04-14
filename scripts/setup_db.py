import sys
import os

# パス設定
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# 共通の接続関数をインポート
from backend.database import get_db_connection

def setup_database():
    print("🛠️ データベースのテーブルを再構築中...")
    conn = get_db_connection()
    cursor = conn.cursor()

    # 既存のテーブルを削除して最新の列構成で作り直す
    cursor.execute("DROP TABLE IF EXISTS stocks")
    cursor.execute('''
        CREATE TABLE stocks (
            symbol TEXT PRIMARY KEY,
            name TEXT,
            sector TEXT,
            market_cap REAL,
            per REAL,
            pbr REAL,
            roe REAL,
            op_margin REAL,
            dividend_yield REAL,
            equity_ratio REAL,
            rev_growth REAL,
            eps_growth REAL,
            high_52wk_diff REAL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()
    print("✅ データベースの準備が整いました（全カラム作成完了）")

if __name__ == "__main__":
    setup_database()
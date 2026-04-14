import sys
import os

# 1️⃣ 【最優先】まず「1つ上の階層」をパスに追加する
# これを backend のインポートより先に書かないとエラーになります
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# 2️⃣ パスが通った後にインポート
from backend.database import get_db_connection

def init_db():
    # 📝 ファイルの場所を scripts フォルダ内に固定
    base_dir = os.path.dirname(os.path.abspath(__file__))
    txt_path = os.path.join(base_dir, "target_symbols.txt")

    if not os.path.exists(txt_path):
        print(f"❌ リストが見つかりません: {txt_path}")
        return

    with open(txt_path, "r") as f:
        symbols = [s.strip() for s in f.readlines() if s.strip()]

    if not symbols:
        print("⚠️ リストが空です。")
        return

    conn = get_db_connection()
    cursor = conn.cursor()

    print(f"📦 DBに {len(symbols)} 件の銘柄を初期登録中...")
    
    for symbol in symbols:
        # 重複を避けて登録
        cursor.execute("INSERT OR IGNORE INTO stocks (symbol) VALUES (?)", (symbol,))
    
    conn.commit()
    conn.close()
    print("✨ 初期登録が完了しました！")

if __name__ == "__main__":
    init_db()
# backend/database.py
import sqlite3
import os

# ファイルの場所を絶対パスで固定
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'stocks.db')

def get_db_connection():
    # 💡 重要：ここには他のファイルからの import を書かない！
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
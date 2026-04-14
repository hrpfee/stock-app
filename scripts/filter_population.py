import pandas as pd
import os
import sys

# パス設定（プロジェクトルートを追加）
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def get_jpx_population():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    xls_path = os.path.join(base_dir, "data_j.xls")

    if not os.path.exists(xls_path):
        raise FileNotFoundError(f"❌ '{xls_path}' が見つかりません。scriptsフォルダにdata_j.xlsを置いてください。")

    print(f"📖 ローカルファイル {xls_path} を読み込み中...")
    
    # xlrd エンジンを使用して読み込み
    df = pd.read_excel(xls_path, engine='xlrd')

    # ✅ 修正ポイント：プライム市場のみに厳選
    target_segments = ["プライム（内国株式）"]
    df_filtered = df[df["市場・商品区分"].isin(target_segments)]

    print(f"✅ プライム市場への絞り込み完了: {len(df)}社 -> {len(df_filtered)}社")
    
    # 銘柄コードの整形（英字コード '146A' 等にも対応）
    symbols = []
    for code in df_filtered["コード"]:
        code_str = str(code).split('.')[0] # '7203.0' などの小数点を確実に消す
        symbols.append(f"{code_str}.T")
        
    return symbols

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(base_dir, "target_symbols.txt")

    try:
        symbols = get_jpx_population()
        with open(output_path, "w") as f:
            f.write("\n".join(symbols))
        print(f"📄 {output_path} に約{len(symbols)}件の銘柄リストを保存しました。")
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
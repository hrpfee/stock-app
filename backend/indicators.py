# backend/indicators.py
import pandas as pd

# ✅ 関数名が add_indicators (sあり) であることを確認してください
def add_indicators(df: pd.DataFrame):
    """
    株価データに移動平均線とRSIを追加する
    """
    # 移動平均線
    df['ma5'] = df['Close'].rolling(window=5).mean()
    df['ma25'] = df['Close'].rolling(window=25).mean()

    # RSI
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    loss = loss.replace(0, 0.00001) # 0除算対策
    rs = gain / loss
    df['rsi'] = 100 - (100 / (1 + rs))

    return df
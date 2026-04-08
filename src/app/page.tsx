"use client";
import { useState, useEffect } from "react";

export default function Home() {
  // --- 1. 状態（State）の定義 ---
  const [symbol, setSymbol] = useState("");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- 2. 副作用（Effect：保存と読み込み）の定義 ---
  useEffect(() => {
    const saved = localStorage.getItem("my-watchlist");
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("my-watchlist", JSON.stringify(watchlist));
    }
  }, [watchlist, isInitialized]);

  // --- 3. 動き（Functions：追加と削除）の定義 ---
  const addToWatchlist = () => {
    if (symbol && !watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol]);
      setSymbol("");
    }
  };

  const removeFromWatchlist = (target: string) => {
    const updatedList = watchlist.filter((item) => item !== target);
    setWatchlist(updatedList);
  };

  // --- 4. 特殊な表示（ガード句） ---
  if (!isInitialized) {
    return <div className="min-h-screen bg-slate-900 text-white p-10 text-center">読み込み中...</div>;
  }

  // --- 5. 見た目（UI / JSX） ---
  return (
    <main className="p-10 bg-slate-900 min-h-screen text-white flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
      
      {/* 入力エリア */}
      <div className="flex gap-2 mb-10">
        <input 
          value={symbol} 
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="銘柄を入力 (例: TSLA)"
          className="bg-slate-800 border border-slate-700 p-2 rounded text-white"
        />
        <button onClick={addToWatchlist} className="bg-blue-600 hover:bg-blue-500 p-2 px-4 rounded font-bold transition">
          追加
        </button>
      </div>

      {/* リスト表示エリア */}
      <div className="w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 border-b border-slate-700 pb-2">お気に入り</h2>
        <ul className="space-y-2">
          {watchlist.map((item) => (
            <li key={item} className="bg-slate-800 p-3 rounded flex justify-between items-center shadow-md border border-slate-700">
              <span className="font-mono font-bold text-lg">{item}</span>
              <button 
                onClick={() => removeFromWatchlist(item)}
                className="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white text-xs py-1 px-3 rounded-full border border-red-500 transition-all"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
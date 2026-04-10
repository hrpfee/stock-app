"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [news, setNews] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [watchlistData, setWatchlistData] = useState<Record<string, any>>({});
  const [marketIndices, setMarketIndices] = useState<Record<string, any>>({});

  const INDICES_CONFIG = [
    { label: "NIKKEI 225", symbol: "^N225", category: "I" },
    { label: "DOW JONES", symbol: "^DJI", category: "I" },
    { label: "USD/JPY", symbol: "JPY=X", category: "F" },
    { label: "BITCOIN", symbol: "BTC-USD", category: "C" },
  ];

  // ✅ 共通のデータ取得関数（場所を useEffect の上へ移動）
  const fetchStockData = async (symbol: string, setter: Function) => {
    try {
      const res = await fetch(`http://localhost:8000/api/stock/${symbol}?timeframe=1d`);
      const data = await res.json();
      setter((prev: any) => ({ ...prev, [symbol]: data }));
    } catch (e) {
      console.error(`Error fetching ${symbol}:`, e);
    }
  };

  useEffect(() => {
    // 1. ニュースと決算の取得
    fetch("http://localhost:8000/api/market-news").then(res => res.json()).then(setNews);
    fetch("http://localhost:8000/api/earnings-calendar").then(res => res.json()).then(setEarnings);

    // 2. 指標データの取得
    INDICES_CONFIG.forEach(idx => fetchStockData(idx.symbol, setMarketIndices));

    // 3. ウォッチリストの復元とデータ取得
    const saved = localStorage.getItem("my-watchlist");
    const list = saved ? JSON.parse(saved) : ["AAPL", "7203.T"];
    setWatchlist(list);
    
    // リスト内の各銘柄のデータを取得
    list.forEach((symbol: string) => fetchStockData(symbol, setWatchlistData));
  }, []);

  return (
    <div className="h-full bg-black text-slate-200 overflow-y-auto custom-scrollbar">
      <div className="p-6 max-w-[1500px] mx-auto grid grid-cols-12 gap-8">
        
        {/* 📰 左側：メインニュースエリア */}
        <div className="col-span-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-1 h-4 bg-blue-600"></span>
            <h2 className="text-sm font-black text-white italic tracking-widest uppercase">Intelligence Feed</h2>
          </div>
          
          <div className="space-y-3">
            {news.map((item: any, i) => (
              <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="block bg-slate-900/30 border border-slate-800/50 p-4 rounded-lg hover:border-blue-500/40 hover:bg-blue-600/5 transition-all group">
                <div className="flex gap-4">
                  {item.thumbnail && <img src={item.thumbnail} className="w-16 h-16 object-cover rounded border border-slate-800" />}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">{item.related}</span>
                        <span className="text-[9px] text-slate-500 font-bold">{item.publisher}</span>
                      </div>
                    </div>
                    <h3 className="text-slate-200 font-bold group-hover:text-white text-sm leading-snug">{item.title}</h3>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* 📊 右側：サイドバーエリア */}
        <div className="col-span-4 space-y-6">
          
          {/* 1. 市場指標 */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Market Indices
            </h3>
            <div className="grid grid-cols-1 gap-1.5">
              {INDICES_CONFIG.map(idx => (
                <Link key={idx.symbol} href={`/analysis?symbol=${idx.symbol}`} className="flex justify-between items-center p-2.5 bg-slate-900/20 border border-slate-800/50 rounded-lg hover:border-blue-500/50 transition-all group">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-300 group-hover:text-blue-400 transition-colors">{idx.label}</span>
                    <span className="text-[7px] text-slate-600 font-mono uppercase">{idx.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-mono font-bold text-white">{marketIndices[idx.symbol]?.price || "---"}</div>
                    <div className={`text-[8px] font-bold ${marketIndices[idx.symbol]?.isPositive ? "text-green-500" : "text-red-500"}`}>
                      {marketIndices[idx.symbol]?.percent || ""}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* 2. ウォッチリスト */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> My Watchlist
            </h3>
            <div className="grid grid-cols-1 gap-1.5">
              {watchlist.map(symbol => {
                const data = watchlistData[symbol];
                return (
                  <Link 
                    key={symbol} 
                    href={`/analysis?symbol=${symbol}`} 
                    className="flex justify-between items-center p-2.5 bg-slate-900/20 border border-slate-800/50 rounded-lg hover:border-purple-500/50 transition-all group"
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-300 group-hover:text-purple-400 transition-colors">
                        {data?.name || symbol}
                      </span>
                      <span className="text-[7px] text-slate-600 font-mono uppercase">{symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-mono font-bold text-white">
                        {data?.price ? data.price.toLocaleString() : "---"}
                      </div>
                      <div className={`text-[8px] font-bold ${data?.isPositive ? "text-green-500" : "text-red-500"}`}>
                        {data?.percent || "0.00%"}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 3. 近日の決算日程 */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Earnings Schedule
            </h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              {earnings.map((stock: any, i) => (
                <div key={i} className="p-3 border-b border-slate-800 last:border-none flex justify-between items-center hover:bg-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white">{stock.symbol}</span>
                    <span className="text-[8px] text-slate-600 font-bold uppercase truncate max-w-[100px]">{stock.name}</span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{stock.date}</span>
                    <span className="text-[7px] text-blue-500 font-black uppercase">Reported</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. サーバー状態 */}
          <section className="p-4 bg-slate-900/20 border border-slate-800 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System Status</span>
              <span className="flex items-center gap-1.5 text-[9px] font-black text-green-500">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> ONLINE
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[7px] font-black text-slate-600 uppercase">
                <span>API Latency</span>
                <span>24ms</span>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-[92%] animate-pulse"></div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
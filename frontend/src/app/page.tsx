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
    fetch("http://127.0.0.1:8000/api/market-news")
      .then(res => res.json())
      .then(data => {
        setNews(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("News fetch error:", err);
        setNews([]);
      });

    fetch("http://127.0.0.1:8000/api/earnings-calendar")
      .then(res => res.json())
      .then(data => {
        setEarnings(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Earnings fetch error:", err);
        setEarnings([]);
      });

    INDICES_CONFIG.forEach(idx => fetchStockData(idx.symbol, setMarketIndices));

    const saved = localStorage.getItem("my-watchlist");
    const list = saved ? JSON.parse(saved) : ["AAPL", "7203.T"];
    setWatchlist(list);
    list.forEach((symbol: string) => fetchStockData(symbol, setWatchlistData));
  }, []);

  const safeNews = Array.isArray(news) ? news : [];

  return (
    // bg-black -> bg-white, text-slate-200 -> text-slate-800
    <div className="h-full bg-white text-slate-800 overflow-y-auto custom-scrollbar">
      <div className="p-6 max-w-[1500px] mx-auto grid grid-cols-12 gap-8">
        
        {/* 📰 左側：メインニュースエリア */}
        <div className="col-span-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-1 h-4 bg-black-600"></span>
            {/* text-white -> text-black */}
            <h2 className="text-sm font-black text-black italic tracking-widest uppercase">▪︎NEWS</h2>
          </div>
          
          <div className="space-y-3">
            {safeNews.length > 0 ? (
              safeNews.map((item: any, i) => (
                // bg-slate-900/30 -> bg-slate-50, border-slate-800/50 -> border-slate-200
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="block bg-slate-50 border border-slate-200 p-4 rounded-lg hover:border-blue-500/40 hover:bg-blue-50 transition-all group">
                  <div className="flex gap-4">
                    {/* border-slate-800 -> border-slate-200 */}
                    {item.thumbnail && <img src={item.thumbnail} className="w-16 h-16 object-cover rounded border border-slate-200" alt="" />}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{item.related}</span>
                          <span className="text-[9px] text-slate-400 font-bold">{item.publisher}</span>
                        </div>
                      </div>
                      {/* text-slate-200 -> text-slate-900, group-hover:text-white -> group-hover:text-blue-600 */}
                      <h3 className="text-slate-900 font-bold group-hover:text-blue-600 text-sm leading-snug">{item.title}</h3>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              // border-slate-900 -> border-slate-100
              <div className="p-10 text-center text-slate-400 font-black text-xs tracking-widest uppercase border border-slate-100 border-dashed rounded-xl">
                No News Intelligence Available
              </div>
            )}
          </div>
        </div>

        {/* 📊 右側：サイドバーエリア */}
        <div className="col-span-4 space-y-6">
          
          {/* 1. 市場指標 */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Market Indices
            </h3>
            <div className="grid grid-cols-1 gap-1.5">
              {INDICES_CONFIG.map(idx => (
                // bg-slate-900/20 -> bg-slate-50, border-slate-800/50 -> border-slate-200
                <Link key={idx.symbol} href={`/analysis?symbol=${idx.symbol}`} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-500/50 transition-all group">
                  <div className="flex flex-col">
                    {/* text-slate-300 -> text-slate-700 */}
                    <span className="text-[10px] font-black text-slate-700 group-hover:text-blue-600 transition-colors">{idx.label}</span>
                    <span className="text-[7px] text-slate-400 font-mono uppercase">{idx.symbol}</span>
                  </div>
                  <div className="text-right">
                    {/* text-white -> text-black */}
                    <div className="text-[11px] font-mono font-bold text-black">{marketIndices[idx.symbol]?.price || "---"}</div>
                    <div className={`text-[8px] font-bold ${marketIndices[idx.symbol]?.isPositive ? "text-green-600" : "text-red-600"}`}>
                      {marketIndices[idx.symbol]?.percent || ""}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* 2. ウォッチリスト */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> My Watchlist
            </h3>
            <div className="grid grid-cols-1 gap-1.5">
              {watchlist.map(symbol => {
                const data = watchlistData[symbol];
                return (
                  <Link 
                    key={symbol} 
                    href={`/analysis?symbol=${symbol}`} 
                    className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-purple-500/50 transition-all group"
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-700 group-hover:text-purple-600 transition-colors">
                        {data?.name || symbol}
                      </span>
                      <span className="text-[7px] text-slate-400 font-mono uppercase">{symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-mono font-bold text-black">
                        {data?.price ? data.price.toLocaleString() : "---"}
                      </div>
                      <div className={`text-[8px] font-bold ${data?.isPositive ? "text-green-600" : "text-red-600"}`}>
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
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Earnings Schedule
            </h3>
            {/* bg-slate-950 -> bg-white, border-slate-800 -> border-slate-200, shadow-2xl -> shadow-sm */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {earnings.map((stock: any, i) => (
                // border-slate-800 -> border-slate-100, hover:bg-white/5 -> hover:bg-slate-50
                <div key={i} className="p-3 border-b border-slate-100 last:border-none flex justify-between items-center hover:bg-slate-50">
                  <div className="flex flex-col">
                    {/* text-white -> text-black */}
                    <span className="text-[10px] font-black text-black">{stock.symbol}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase truncate max-w-[100px]">{stock.name}</span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    {/* text-slate-400 -> text-slate-600 */}
                    <span className="text-[10px] font-mono font-bold text-slate-600">{stock.date}</span>
                    <span className="text-[7px] text-blue-500 font-black uppercase">Reported</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. サーバー状態 */}
          {/* bg-slate-900/20 -> bg-slate-50, border-slate-800 -> border-slate-200 */}
          <section className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Status</span>
              <span className="flex items-center gap-1.5 text-[9px] font-black text-green-600">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> ONLINE
              </span>
            </div>
            <div className="space-y-1">
              {/* text-slate-600 -> text-slate-400 */}
              <div className="flex justify-between text-[7px] font-black text-slate-400 uppercase">
                <span>API Latency</span>
                <span className="text-slate-900">24ms</span>
              </div>
              {/* bg-slate-800 -> bg-slate-200 */}
              <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-[92%] animate-pulse"></div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
import StockChart from "@/components/StockChart";

export default function Home() {
  const [symbol, setSymbol] = useState("");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL"); // ✅ 今大きく表示している銘柄
  const [timeframe, setTimeframe] = useState("1d");
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [isFetching, setIsFetching] = useState(false);

  // 初期読み込み
  useEffect(() => {
    const saved = localStorage.getItem("my-watchlist");
    const initialList = saved ? JSON.parse(saved) : ["AAPL", "GOOGL", "TSLA", "7203.T"];
    setWatchlist(initialList);
    setSelectedSymbol(initialList[0]);
  }, []);

  // 選択中の銘柄や期間が変わったら、その銘柄のデータだけを優先して取る
  useEffect(() => {
    fetchSingleStock(selectedSymbol, timeframe);
  }, [selectedSymbol, timeframe]);

  const fetchSingleStock = async (ticker: string, tf: string) => {
    setIsFetching(true);
    try {
      const response = await fetch(`http://localhost:8000/api/stock/${ticker}?timeframe=${tf}`);
      const data = await response.json();
      setPrices(prev => ({ ...prev, [ticker]: data }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  };

  const addToWatchlist = () => {
    if (symbol && !watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol]);
      setSymbol("");
      setSelectedSymbol(symbol); // 追加したら即表示
    }
  };

  return (
    <div className="flex h-screen bg-black text-slate-200 overflow-hidden">
      
      {/* 🟦 メインエリア (左 3/4) */}
      <div className="flex-1 flex flex-col border-r border-slate-800">
        
        {/* 1. 左上：検索 & ツールバー */}
        <header className="h-16 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <input 
                value={symbol} 
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="bg-transparent px-3 py-1 outline-none w-32 font-bold text-blue-400 placeholder:text-slate-600"
                placeholder="SEARCH..."
                onKeyDown={(e) => e.key === 'Enter' && addToWatchlist()}
              />
              <button onClick={addToWatchlist} className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-md text-xs font-bold transition-all">
                ADD
              </button>
            </div>
            
            {/* 期間切り替え */}
            <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
              {["5m", "1d", "1w", "1mo"].map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded text-xs font-bold ${timeframe === tf ? "bg-slate-700 text-white shadow" : "text-slate-500 hover:text-slate-300"}`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* 選択中の銘柄情報表示 */}
          {prices[selectedSymbol] && (
            <div className="flex items-center gap-4">
              <span className="text-xl font-black">{selectedSymbol}</span>
              <span className="text-2xl font-mono text-white">${prices[selectedSymbol].price}</span>
              <span className={`font-bold ${prices[selectedSymbol].isPositive ? "text-green-500" : "text-red-500"}`}>
                {prices[selectedSymbol].percent}
              </span>
            </div>
          )}
        </header>

        {/* 2. 中央：巨大チャート */}
        <main className="flex-1 p-6 bg-gradient-to-b from-slate-900 to-black overflow-hidden flex flex-col">
          {prices[selectedSymbol] ? (
            <div className="flex-1 flex flex-col">
               {/* StockChartに高さをフルで使わせる設定 */}
               <StockChart data={prices[selectedSymbol].chartData} isPositive={prices[selectedSymbol].isPositive} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 animate-pulse">
              LOADING CHART...
            </div>
          )}
        </main>
      </div>

      {/* 🟧 右サイド：ウォッチリスト (1/4) */}
      <aside className="w-80 bg-slate-900 flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="font-bold text-slate-400 uppercase tracking-widest text-sm">Watchlist</h2>
          {isFetching && <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>}
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {watchlist.map((item) => {
            const data = prices[item];
            const isActive = selectedSymbol === item;
            return (
              <div 
                key={item}
                onClick={() => setSelectedSymbol(item)}
                className={`p-4 border-b border-slate-800 cursor-pointer transition-all hover:bg-slate-800 flex justify-between items-center ${isActive ? "bg-blue-900/20 border-l-4 border-l-blue-500" : ""}`}
              >
                <div>
                  <div className="font-bold text-white">{item}</div>
                  <div className="text-[10px] text-slate-500">Nasdaq / Global Select</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{data ? `$${data.price}` : "---"}</div>
                  <div className={`text-xs font-bold ${data?.isPositive ? "text-green-500" : "text-red-500"}`}>
                    {data ? data.percent : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
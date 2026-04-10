"use client";
import { useState, useEffect } from "react";
import StockChart, { ChartConfig } from "@/components/StockChart";

// Drag & Drop ライブラリ
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

export default function Home() {
  const [symbol, setSymbol] = useState("");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [timeframe, setTimeframe] = useState("1d");
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [isFetching, setIsFetching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [market, setMarket] = useState<"US" | "JP">("US");
  const [isComposing, setIsComposing] = useState(false);

  // ⚙️ 指標の表示設定
  const [showSettings, setShowSettings] = useState(false);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    ma5: true, ma25: true, ma75: true,
    bb: false, macd: true, rsi: true, volume: true
  });

  // 🌍 主要指標 (Indices) の設定
  const [marketIndices, setMarketIndices] = useState<Record<string, any>>({});
  const INDICES_CONFIG = [
    { label: "NIKKEI 225", symbol: "^N225", category: "Index" },
    { label: "NIKKEI FUTURES", symbol: "NK=F", category: "Futures" },
    { label: "DOW JONES", symbol: "^DJI", category: "Index" },
    { label: "DOW FUTURES", symbol: "YM=F", category: "Futures" },
    { label: "NASDAQ 100", symbol: "^NDX", category: "Index" },
    { label: "S&P 500", symbol: "^GSPC", category: "Index" },
    { label: "GOLD", symbol: "GC=F", category: "Commodity" },
    { label: "WTI OIL", symbol: "CL=F", category: "Commodity" },
    { label: "USD/JPY", symbol: "JPY=X", category: "Forex" },
    { label: "BITCOIN", symbol: "BTC-USD", category: "Crypto" },
  ];

  // --- 1. 初期化・データ同期 ---
  useEffect(() => {
    // ウォッチリストの復元
    const saved = localStorage.getItem("my-watchlist");
    const initialList = saved ? JSON.parse(saved) : ["AAPL", "7203.T"];
    setWatchlist(initialList);
    setSelectedSymbol(initialList[0]);

    // 指標設定の復元
    const savedConfig = localStorage.getItem("chart-config");
    if (savedConfig) setChartConfig(JSON.parse(savedConfig));

    // 全ての主要指標を初回取得
    INDICES_CONFIG.forEach(idx => fetchIndexData(idx.symbol));
  }, []);

  useEffect(() => {
    fetchSingleStock(selectedSymbol, timeframe);
  }, [selectedSymbol, timeframe]);

  const fetchIndexData = async (ticker: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/stock/${ticker}?timeframe=1d`);
      const data = await res.json();
      setMarketIndices(prev => ({ ...prev, [ticker]: data }));
    } catch (e) { console.error("Index fetch failed", e); }
  };

  const fetchSingleStock = async (ticker: string, tf: string) => {
    setIsFetching(true);
    try {
      const response = await fetch(`http://localhost:8000/api/stock/${ticker}?timeframe=${tf}`);
      const data = await response.json();
      setPrices(prev => ({ ...prev, [ticker]: { ...prev[ticker], ...data } }));
    } catch (e) { console.error("Fetch price failed:", e); } finally { setIsFetching(false); }
  };

  const toggleConfig = (key: keyof ChartConfig) => {
    const newConfig = { ...chartConfig, [key]: !chartConfig[key] };
    setChartConfig(newConfig);
    localStorage.setItem("chart-config", JSON.stringify(newConfig));
  };

  // --- 2. 検索・追加ロジック ---
  const handleSearch = async (val: string) => {
    setSymbol(val);
    if (isComposing || val.length < 1) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(val)}&market=${market}`);
      const data = await res.json();
      setSuggestions(data);
    } catch (e) { console.error("Search failed:", e); }
  };

  const selectAndAddStock = (ticker: string) => {
    const target = suggestions.find(s => s.symbol.toUpperCase() === ticker.toUpperCase()) || suggestions[0];
    if (!target) return;

    const finalTicker = target.symbol;
    setSelectedSymbol(finalTicker);
    
    setPrices(prev => ({
      ...prev,
      [finalTicker]: { ...prev[finalTicker], name: target.name, exch: target.exch }
    }));

    if (!watchlist.includes(finalTicker)) {
      const newList = [finalTicker, ...watchlist];
      setWatchlist(newList);
      localStorage.setItem("my-watchlist", JSON.stringify(newList));
    }
    setSymbol("");
    setSuggestions([]);
  };

  const removeFromWatchlist = (e: React.MouseEvent, ticker: string) => {
    e.stopPropagation();
    const newList = watchlist.filter(item => item !== ticker);
    setWatchlist(newList);
    localStorage.setItem("my-watchlist", JSON.stringify(newList));
    if (selectedSymbol === ticker && newList.length > 0) setSelectedSymbol(newList[0]);
  };

  // --- 3. Drag & Drop ---
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      setWatchlist((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newList = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem("my-watchlist", JSON.stringify(newList));
        return newList;
      });
    }
  };

  // ウォッチリストのアイテムコンポーネント
  function SortableWatchlistItem({ item, data, isActive }: { item: string, data: any, isActive: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({id: item});
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 0, opacity: isDragging ? 0.5 : 1 };

    return (
      <div ref={setNodeRef} style={style} className={`group p-3 border-b border-slate-800/50 flex justify-between items-center transition-all ${isActive ? "bg-blue-600/10 border-l-4 border-l-blue-500" : "hover:bg-slate-900"}`}>
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab text-slate-700 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M7 2a2 2 0 11-4 0 2 2 0 014 0zM7 9a2 2 0 11-4 0 2 2 0 014 0zM7 16a2 2 0 11-4 0 2 2 0 014 0zM17 2a2 2 0 11-4 0 2 2 0 014 0zM17 9a2 2 0 11-4 0 2 2 0 014 0zM17 16a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div onClick={() => setSelectedSymbol(item)} className="cursor-pointer">
            <div className="font-bold text-xs text-slate-200 truncate w-32">{data?.name || item}</div>
            <div className="text-[9px] text-slate-600 font-bold uppercase">{item}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right font-mono">
            <div className="text-[11px] text-white font-bold">{data?.price || "---"}</div>
            <div className={`text-[9px] ${data?.isPositive ? "text-green-500" : "text-red-500"}`}>{data?.percent || ""}</div>
          </div>
          <button onClick={(e) => removeFromWatchlist(e, item)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-500 transition-all">✕</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-slate-200 overflow-hidden font-sans">
      {/* 🟦 メインエリア */}
      <div className="flex-1 flex flex-col border-r border-slate-800">
        <header className="h-16 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            {/* 市場トグル */}
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700 shadow-inner">
              <button onClick={() => setMarket("US")} className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${market === "US" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}>US</button>
              <button onClick={() => setMarket("JP")} className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${market === "JP" ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}>JP</button>
            </div>

            {/* 検索 */}
            <div className="relative">
              <input 
                value={symbol}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={(e) => { setIsComposing(false); handleSearch(e.currentTarget.value); }}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !isComposing && symbol) selectAndAddStock(symbol); }}
                className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg w-64 text-white focus:border-blue-500 outline-none text-sm transition-all"
                placeholder="Search ticker..."
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-[320px] mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50">
                  {suggestions.map((s) => (
                    <div key={s.symbol} onClick={() => selectAndAddStock(s.symbol)} className="p-3 hover:bg-slate-700 cursor-pointer flex justify-between items-center border-b border-slate-700/30">
                      <div className="flex flex-col"><span className="font-bold text-white text-sm truncate w-48">{s.name}</span><span className="text-[10px] text-slate-500 uppercase">{s.symbol}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ⚙️ 指標設定 */}
            <div className="relative">
              <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg border transition-all ${showSettings ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
                ⚙️ <span className="text-[10px] font-black ml-1 uppercase">Indicators</span>
              </button>
              {showSettings && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[100] p-4 space-y-3">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Technical Analysis</h3>
                  <div className="space-y-2">
                    {(Object.keys(chartConfig) as Array<keyof ChartConfig>).map((key) => (
                      <label key={key} className="flex items-center justify-between cursor-pointer group">
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase">{key}</span>
                        <input type="checkbox" checked={chartConfig[key]} onChange={() => toggleConfig(key)} className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500" />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 期間 */}
            <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              {["5m", "1d", "1w", "1mo"].map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${timeframe === tf ? "bg-slate-700 text-white shadow" : "text-slate-500 hover:text-slate-300"}`}>{tf.toUpperCase()}</button>
              ))}
            </div>
          </div>

          {/* 選択中の銘柄情報 */}
          <div className="flex items-center gap-4 bg-slate-800/30 px-4 py-2 rounded-xl border border-slate-800">
            <div className="flex flex-col">
              <span className="text-sm font-black text-white truncate max-w-[120px]">{prices[selectedSymbol]?.name || selectedSymbol}</span>
              <span className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">{selectedSymbol}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-black text-white">{prices[selectedSymbol]?.price || "---"}</span>
              <span className="text-[10px] text-slate-500 font-bold mr-2 uppercase">{prices[selectedSymbol]?.currency}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prices[selectedSymbol]?.isPositive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{prices[selectedSymbol]?.percent || "0.00%"}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 bg-gradient-to-b from-slate-950 to-black flex flex-col">
          {prices[selectedSymbol] ? (
            <div className="flex-1">
               <StockChart data={prices[selectedSymbol].chartData} isPositive={prices[selectedSymbol].isPositive} currency={prices[selectedSymbol]?.currency} config={chartConfig} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-700 animate-pulse font-black text-2xl italic">LOADING...</div>
          )}
        </main>
      </div>

      {/* 🟧 右サイドバー */}
      <aside className="w-80 bg-slate-950 flex flex-col border-l border-slate-800">
  {/* 🌍 1. Market Monitors (固定エリア・コンパクト版) */}
  <div className="flex flex-col border-b border-slate-800 bg-slate-900/40">
    <div className="p-3 border-b border-slate-800/50 flex justify-between items-center">
      <h2 className="font-black text-blue-500 uppercase tracking-widest text-[9px]">Market Monitors</h2>
      <span className="text-[7px] text-slate-500 italic">Click to view chart</span>
    </div>
    
    {/* 表示サイズを小さくし、ここ自体を独立してスクロール可能に (max-hを縮小) */}
    <div className="p-2 overflow-y-auto max-h-[280px] custom-scrollbar bg-black/20">
      <div className="grid grid-cols-1 gap-1">
        {INDICES_CONFIG.map(idx => {
          const isActive = selectedSymbol === idx.symbol;
          const data = marketIndices[idx.symbol];
          
          return (
            <div 
              key={idx.symbol} 
              onClick={() => setSelectedSymbol(idx.symbol)}
              className={`flex justify-between items-center p-1.5 rounded border transition-all cursor-pointer group
                ${isActive 
                  ? "border-blue-500/50 bg-blue-600/10" 
                  : "border-slate-800/30 bg-black/40 hover:border-slate-700 hover:bg-slate-900/30"
                }`}
            >
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1">
                  <span className={`text-[9px] font-bold truncate max-w-[100px] ${isActive ? "text-blue-400" : "text-slate-300"}`}>
                    {idx.label}
                  </span>
                  <span className="text-[6px] px-0.5 bg-slate-800 text-slate-500 rounded font-bold uppercase">
                    {idx.category[0]} {/* カテゴリの頭文字だけで省スペース化 */}
                  </span>
                </div>
                <span className="text-[7px] text-slate-600 font-mono">{idx.symbol}</span>
              </div>
              
              <div className="text-right leading-tight">
                <div className={`text-[10px] font-mono font-bold ${isActive ? "text-white" : "text-slate-200"}`}>
                  {data?.price || "---"}
                </div>
                <div className={`text-[8px] font-bold ${data?.isPositive ? "text-green-500" : "text-red-500"}`}>
                  {data?.percent || "0.00%"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>

  {/* 📋 2. Watchlist (独立したスクロールエリア) */}
  <div className="flex flex-col flex-1 overflow-hidden">
    <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/10">
      <h2 className="font-black text-slate-500 uppercase tracking-widest text-[9px]">Watchlist</h2>
      {isFetching && (
        <div className="flex items-center gap-1.5">
          <span className="text-[7px] text-blue-500 animate-pulse font-bold">UPDATING</span>
          <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping"></div>
        </div>
      )}
    </div>

    {/* ウォッチリストだけが大きくスクロールする */}
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <SortableContext items={watchlist} strategy={verticalListSortingStrategy}>
          {watchlist.map((item) => (
            <SortableWatchlistItem 
              key={item} 
              item={item} 
              data={prices[item]} 
              isActive={selectedSymbol === item} 
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  </div>
</aside>
    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
import StockChart from "@/components/StockChart";

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

  // 🌍 主要指標 (Indices) 用のステート
  const [marketIndices, setMarketIndices] = useState<Record<string, any>>({});
  const INDICES_CONFIG = [
    { label: "NIKKEI 225", symbol: "^N225" },
    { label: "DOW JONES", symbol: "^DJI" },
    { label: "NASDAQ", symbol: "^IXIC" }
  ];

  // --- 1. 初期化・データ同期 ---

  useEffect(() => {
    const saved = localStorage.getItem("my-watchlist");
    const initialList = saved ? JSON.parse(saved) : ["AAPL", "7203.T"];
    setWatchlist(initialList);
    setSelectedSymbol(initialList[0]);

    // 主要指標の初回取得
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
      <div className="flex-1 flex flex-col border-r border-slate-800">
        <header className="h-16 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-900/50">
          <div className="flex items-center gap-6">
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700 shadow-inner">
              <button onClick={() => setMarket("US")} className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${market === "US" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}>US</button>
              <button onClick={() => setMarket("JP")} className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${market === "JP" ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}>JP</button>
            </div>

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

            <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              {["5m", "1d", "1w", "1mo"].map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${timeframe === tf ? "bg-slate-700 text-white shadow" : "text-slate-500 hover:text-slate-300"}`}>{tf.toUpperCase()}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/30 px-4 py-2 rounded-xl border border-slate-800">
            <div className="flex flex-col">
              <span className="text-sm font-black text-white truncate max-w-[120px]">{prices[selectedSymbol]?.name || selectedSymbol}</span>
              <span className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">{selectedSymbol}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-black text-white">{prices[selectedSymbol]?.price || "---"}</span>
              {/* ✅ 通貨単位 (USD/JPY) を表示 */}
              <span className="text-[10px] text-slate-500 font-bold mr-2 uppercase">{prices[selectedSymbol]?.currency}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prices[selectedSymbol]?.isPositive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{prices[selectedSymbol]?.percent || "0.00%"}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 bg-gradient-to-b from-slate-950 to-black flex flex-col">
          {prices[selectedSymbol] ? <div className="flex-1"><StockChart data={prices[selectedSymbol].chartData} isPositive={prices[selectedSymbol].isPositive} /></div> : <div className="flex-1 flex items-center justify-center text-slate-700 animate-pulse font-black text-2xl italic">LOADING...</div>}
        </main>
      </div>

      <aside className="w-80 bg-slate-950 flex flex-col border-l border-slate-800">
        {/* 🌏 Market Indices (主要指標) セクション */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/40 shadow-inner">
          <h2 className="font-black text-blue-500 uppercase tracking-widest text-[10px] mb-3">Market Indices</h2>
          <div className="grid grid-cols-1 gap-2">
            {INDICES_CONFIG.map(idx => (
              <div key={idx.symbol} className="flex justify-between items-center p-2.5 bg-black/40 rounded-lg border border-slate-800/50 hover:border-slate-700 transition-colors">
                <span className="text-[10px] font-bold text-slate-400">{idx.label}</span>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-white">{marketIndices[idx.symbol]?.price || "---"}</div>
                  <div className={`text-[9px] font-bold ${marketIndices[idx.symbol]?.isPositive ? "text-green-500" : "text-red-500"}`}>{marketIndices[idx.symbol]?.percent || ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 📋 ウォッチリスト */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/10">
          <h2 className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Watchlist</h2>
          {isFetching && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></div>}
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <SortableContext items={watchlist} strategy={verticalListSortingStrategy}>
              {watchlist.map((item) => (
                <SortableWatchlistItem key={item} item={item} data={prices[item]} isActive={selectedSymbol === item} />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      </aside>
    </div>
  );
}
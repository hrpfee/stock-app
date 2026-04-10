"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import StockChart, { ChartConfig } from "@/components/StockChart";

// Drag & Drop
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function Home() {
  const searchParams = useSearchParams();
  const [symbol, setSymbol] = useState("");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [timeframe, setTimeframe] = useState("1d");
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [isFetching, setIsFetching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [marketIndices, setMarketIndices] = useState<Record<string, any>>({});
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [market, setMarket] = useState<"US" | "JP">("US");
  const [isComposing, setIsComposing] = useState(false);

  // ✅ 追加: リサイズ用のステート
  const [monitorHeightPercent, setMonitorHeightPercent] = useState(35);
  const [isResizing, setIsResizing] = useState(false);
  
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    ma5: true, ma25: true, ma75: true,
    bb: false, macd: true, rsi: true, volume: true
  });

  const INDICES_CONFIG = [
    { label: "NIKKEI 225", symbol: "^N225", cat: "Index" },
    { label: "NIKKEI FUTURES", symbol: "NK=F", cat: "Futures" },
    { label: "DOW JONES", symbol: "^DJI", cat: "Index" },
    { label: "DOW FUTURES", symbol: "YM=F", cat: "Futures" },
    { label: "NASDAQ 100", symbol: "^NDX", cat: "Index" },
    { label: "S&P 500", symbol: "^GSPC", cat: "Index" },
    { label: "GOLD", symbol: "GC=F", cat: "Commodity" },
    { label: "WTI OIL", symbol: "CL=F", cat: "Commodity" },
    { label: "USD/JPY", symbol: "JPY=X", cat: "Forex" },
    { label: "BITCOIN", symbol: "BTC-USD", cat: "Crypto" },
  ];

  // ✅ 追加: リサイズロジック
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newHeight = (e.clientY / window.innerHeight) * 100;
      if (newHeight > 15 && newHeight < 85) {
        setMonitorHeightPercent(newHeight);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleSearch = async (val: string) => {
    setSymbol(val);
    if (isComposing || val.length < 1) { setSuggestions([]); return; }
    try {
      const res = await fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(val)}&market=${market}`);
      const data = await res.json();
      setSuggestions(data);
    } catch (e) { console.error(e); }
  };

  const selectAndAddStock = (ticker: string) => {
    setSelectedSymbol(ticker);
    if (!watchlist.includes(ticker)) {
      const newList = [ticker, ...watchlist];
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
  };

  useEffect(() => {
    const saved = localStorage.getItem("my-watchlist");
    let initialList = saved ? JSON.parse(saved) : ["AAPL", "7203.T"];
    const urlSymbol = searchParams.get('symbol');
    if (urlSymbol) {
      setSelectedSymbol(urlSymbol);
      if (!initialList.includes(urlSymbol)) initialList = [urlSymbol, ...initialList];
    }
    setWatchlist(initialList);
    INDICES_CONFIG.forEach(idx => fetchIndexData(idx.symbol));
  }, [searchParams]);

  useEffect(() => {
    fetchSingleStock(selectedSymbol, timeframe);
  }, [selectedSymbol, timeframe]);

  const fetchIndexData = async (ticker: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/stock/${ticker}?timeframe=1d`);
      const data = await res.json();
      setMarketIndices(prev => ({ ...prev, [ticker]: data }));
    } catch (e) { console.error(e); }
  };

  const fetchSingleStock = async (ticker: string, tf: string) => {
    setIsFetching(true);
    try {
      const response = await fetch(`http://localhost:8000/api/stock/${ticker}?timeframe=${tf}`);
      const data = await response.json();
      setPrices(prev => ({ ...prev, [ticker]: { ...prev[ticker], ...data } }));
    } catch (e) { console.error(e); } finally { setIsFetching(false); }
  };

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
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 0 };

    return (
      <div 
        ref={setNodeRef} style={style} 
        className={`group p-4 border-b border-slate-200 flex justify-between items-center transition-all cursor-pointer ${isActive ? "bg-white ring-1 ring-inset ring-black" : "bg-slate-100 hover:bg-slate-200"}`}
        onClick={() => setSelectedSymbol(item)}
      >
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="text-slate-400 hover:text-black">⠿</div>
          <div>
            <div className="font-bold text-xs text-black truncate w-24">{data?.name || item}</div>
            <div className="text-[10px] text-slate-500 font-bold">{item}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-black">{data?.price || "---"}</div>
            <div className={`text-[10px] font-bold ${data?.isPositive ? "text-blue-600" : "text-rose-600"}`}>{data?.percent || ""}</div>
          </div>
          <button onClick={(e) => removeFromWatchlist(e, item)} className="p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-black overflow-hidden antialiased">
      <div className="flex-1 flex flex-col border-r border-slate-300">
        <header className="h-16 border-b border-slate-300 flex items-center px-6 justify-between bg-white z-20">
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 border border-slate-300 rounded p-1">
              <button onClick={() => setMarket("US")} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${market === "US" ? "bg-white text-black shadow-sm" : "text-slate-400"}`}>US</button>
              <button onClick={() => setMarket("JP")} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${market === "JP" ? "bg-white text-black shadow-sm" : "text-slate-400"}`}>JP</button>
            </div>

            <div className="relative">
              <input 
                value={symbol}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={(e) => { setIsComposing(false); handleSearch(e.currentTarget.value); }}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-slate-50 border border-slate-300 px-4 py-2 rounded-lg w-64 text-sm outline-none focus:border-black transition-all"
                placeholder="Ticker Search..."
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-[300px] mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl z-50">
                  {suggestions.map((s) => (
                    <div key={s.symbol} onClick={() => selectAndAddStock(s.symbol)} className="p-3 hover:bg-slate-100 cursor-pointer flex justify-between items-center border-b border-slate-100">
                      <div className="flex flex-col"><span className="font-bold text-black text-xs truncate w-40">{s.name}</span><span className="text-[10px] text-slate-400 uppercase">{s.symbol}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setShowSettings(!showSettings)} className={`text-[10px] font-bold px-3 py-2 border rounded transition-all ${showSettings ? 'bg-black text-white' : 'bg-white border-slate-300 text-slate-500 hover:border-black'}`}>
                INDICATORS {showSettings ? "▲" : "▼"}
              </button>
              {showSettings && (
                <div className="absolute top-11 left-0 w-56 bg-white border border-slate-300 shadow-2xl rounded-lg p-4 z-[100]">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Chart Overlays</h3>
                  <div className="space-y-2">
                    {(Object.keys(chartConfig) as Array<keyof ChartConfig>).map((key) => (
                      <label key={key} className="flex items-center justify-between cursor-pointer group">
                        <span className="text-[10px] font-bold text-slate-600 group-hover:text-black uppercase">{key}</span>
                        <input type="checkbox" checked={chartConfig[key]} onChange={() => setChartConfig({...chartConfig, [key]: !chartConfig[key]})} className="w-4 h-4 accent-black shadow-none" />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex bg-slate-100 border border-slate-300 rounded p-1">
              {["5m","1d", "1w", "1mo"].map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)} className={`px-3 py-1 rounded text-[10px] font-bold ${timeframe === tf ? "bg-white text-black shadow-sm" : "text-slate-400"}`}>{tf.toUpperCase()}</button>
              ))}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-black">{prices[selectedSymbol]?.name || selectedSymbol}</div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-2xl font-bold">{prices[selectedSymbol]?.price || "---"}</span>
              <span className={`text-xs font-bold ${prices[selectedSymbol]?.isPositive ? "text-blue-600" : "text-rose-600"}`}>{prices[selectedSymbol]?.percent || "0.00%"}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 bg-white relative">
          {prices[selectedSymbol]?.chartData ? (
             <StockChart data={prices[selectedSymbol].chartData} isPositive={prices[selectedSymbol].isPositive} config={chartConfig} theme="light" />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-100 font-bold uppercase tracking-[1em] animate-pulse text-4xl">Syncing</div>
          )}
        </main>
      </div>

      {/* 🟧 Right Sidebar (可変比率) */}
      <aside className={`w-80 bg-slate-100 flex flex-col border-l border-slate-300 h-full overflow-hidden ${isResizing ? 'select-none' : ''}`}>
        
        {/* 🌍 1. Market Monitor */}
        <div style={{ height: `${monitorHeightPercent}%` }} className="flex flex-col border-b border-slate-300 min-h-0">
          <div className="p-4 border-b border-slate-200 bg-slate-100 flex justify-between items-center shrink-0">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Monitor</h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {INDICES_CONFIG.map(idx => {
              const data = marketIndices[idx.symbol];
              const isActive = selectedSymbol === idx.symbol;
              return (
                <div key={idx.symbol} onClick={() => setSelectedSymbol(idx.symbol)} className={`flex justify-between items-center p-2.5 rounded border transition-all cursor-pointer bg-white ${isActive ? "border-black shadow-sm ring-1 ring-black" : "border-slate-200 hover:border-slate-400"}`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold leading-none mb-1">{idx.label}</span>
                    <span className="text-[8px] text-slate-400 font-mono">{idx.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold leading-none mb-1">{data?.price || "---"}</div>
                    <div className={`text-[9px] font-bold ${data?.isPositive ? "text-blue-600" : "text-rose-600"}`}>{data?.percent || "0.00%"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ↕️ Resize Handle */}
        <div 
          onMouseDown={() => setIsResizing(true)}
          className="h-1.5 bg-slate-300 hover:bg-black cursor-ns-resize transition-all shrink-0 z-30"
        />

        {/* 📋 2. Watchlist */}
        <div style={{ height: `${100 - monitorHeightPercent}%` }} className="flex flex-col min-h-0">
          <div className="p-4 flex justify-between items-center border-b border-slate-300 bg-slate-100 shrink-0">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Watchlist</h2>
          </div>
          <DndContext sensors={useSensors(useSensor(PointerSensor))} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <SortableContext items={watchlist} strategy={verticalListSortingStrategy}>
                {watchlist.map((item) => (
                  <SortableWatchlistItem key={item} item={item} data={prices[item]} isActive={selectedSymbol === item} />
                ))}
              </SortableContext>
            </div>
          </DndContext>
        </div>
      </aside>
    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
import { formatValue } from "./utils"; 
import { JP_SECTORS } from '@/constants/sectors';
import { useRouter } from 'next/navigation';

export default function ScreeningPage() {
  const [market, setMarket] = useState<"JP" | "US">("JP");
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ✅ すべての指標を復元
  const [filters, setFilters] = useState<Record<string, string>>({
    per_min: "", per_max: "",
    pbr_min: "", pbr_max: "",
    peg_ratio_min: "", peg_ratio_max: "",
    roe_min: "", roe_max: "",
    op_margin_min: "",
    equity_ratio_min: "",
    de_ratio_max: "",
    high_52wk_diff_min: "",
    market_cap_min: "",
    sector: ""
  });

  const handleAnalysis = (symbol: string) => {
    router.push(`/analysis?symbol=${symbol}`);
  };

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    fetchResults();
  }, [market, filters.sector]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== "")
      );
      const queryParams = new URLSearchParams({ market, ...activeFilters });
      const res = await fetch(`http://127.0.0.1:8000/api/screener?${queryParams.toString()}`);
      const data = await res.json();
      setStocks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white text-black antialiased">
      
      {/* 🛠️ Sidebar: Full Indicators Restored */}
      <aside className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Market Engine */}
          <div className="space-y-3">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Market Engine</h2>
            <div className="flex bg-white border border-slate-200 rounded p-1">
              {(["JP", "US"] as const).map((m) => (
                <button 
                  key={m}
                  onClick={() => setMarket(m)} 
                  className={`flex-1 py-1.5 rounded text-[11px] font-bold transition-all ${market === m ? "bg-black text-white" : "text-slate-400 hover:text-black"}`}
                >
                  {m === "JP" ? "JAPAN" : "USA"}
                </button>
              ))}
            </div>
          </div>

          {/* Sector Filter */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sector Filter</label>
            <select 
              value={filters.sector}
              onChange={(e) => updateFilter('sector', e.target.value)}
              className="w-full bg-white border border-slate-200 text-black p-2 rounded text-xs outline-none focus:ring-1 focus:ring-black"
            >
              {JP_SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* 📊 All Indicators Restored */}
          <div className="space-y-8 pb-4">
            <FilterCategory title="Scale / 規模">
              <RangeInput label="時価総額 (Min: 百万円)" minKey="market_cap_min" maxKey="" value={filters} onChange={updateFilter} />
            </FilterCategory>

            <FilterCategory title="Valuation / バリュエーション">
              <RangeInput label="PER (倍)" minKey="per_min" maxKey="per_max" value={filters} onChange={updateFilter} />
              <RangeInput label="PBR (倍)" minKey="pbr_min" maxKey="pbr_max" value={filters} onChange={updateFilter} />
              <RangeInput label="PEGレシオ" minKey="peg_ratio_min" maxKey="peg_ratio_max" value={filters} onChange={updateFilter} />
            </FilterCategory>

            <FilterCategory title="Profitability / 収益性">
              <RangeInput label="ROE (%)" minKey="roe_min" maxKey="roe_max" value={filters} onChange={updateFilter} />
              <RangeInput label="営業利益率 (%)" minKey="op_margin_min" maxKey="" value={filters} onChange={updateFilter} />
            </FilterCategory>

            <FilterCategory title="Financial Health / 健全性">
              <RangeInput label="自己資本比率 (%)" minKey="equity_ratio_min" maxKey="" value={filters} onChange={updateFilter} />
              <RangeInput label="D/Eレシオ (倍)" minKey="" maxKey="de_ratio_max" value={filters} onChange={updateFilter} />
            </FilterCategory>

            <FilterCategory title="Momentum / モメンタム">
              <RangeInput label="52週高値乖離 (%)" minKey="high_52wk_diff_min" maxKey="" value={filters} onChange={updateFilter} />
            </FilterCategory>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white">
          <button 
            onClick={fetchResults}
            className="w-full bg-black hover:bg-slate-800 text-white font-bold py-4 rounded text-[11px] uppercase tracking-[0.2em] transition-all"
          >
            Apply Filters
          </button>
        </div>
      </aside>

      {/* 📊 Main Table */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="p-8 border-b border-slate-100 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-black tracking-tight italic">QUANT SCREENER</h1>
            <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-1">Foundational Research — {market} Prime</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-light text-black tracking-tighter">{stocks.length}</span>
            <span className="text-[11px] ml-2 text-slate-400 font-bold uppercase">Matched</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left border-b border-black">
                <th className="sticky top-0 bg-white p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">Ticker</th>
                <th className="sticky top-0 bg-white p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">Company</th>
                <th className="sticky top-0 bg-white p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 text-right">M-Cap</th>
                <th className="sticky top-0 bg-white p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 text-right">ROE</th>
                <th className="sticky top-0 bg-white p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 text-right">PBR</th>
                <th className="sticky top-0 bg-white p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {loading ? (
                <tr><td colSpan={6} className="p-32 text-center text-[11px] text-slate-300 font-bold uppercase tracking-[0.5em]">Analyzing Market Data...</td></tr>
              ) : stocks.length === 0 ? (
                <tr><td colSpan={6} className="p-32 text-center text-[11px] text-slate-300 font-bold uppercase italic">No assets match your criteria.</td></tr>
              ) : (
                stocks.map((s) => (
                  <tr key={s.symbol} className="group hover:bg-slate-50 transition-colors">
                    <td className="p-4 border-b border-slate-100 font-bold text-blue-600 font-mono">{s.symbol}</td>
                    <td className="p-4 border-b border-slate-100">
                      <div className="font-bold text-black truncate max-w-[240px]">{s.name}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-medium tracking-tight">{s.sector}</div>
                    </td>
                    <td className="p-4 border-b border-slate-100 text-right font-mono text-slate-500">
                      {formatValue(s.market_cap, 'mcap')}
                    </td>
                    <td className={`p-4 border-b border-slate-100 text-right font-mono font-bold ${s.roe >= 15 ? "text-blue-600" : "text-black"}`}>
                      {formatValue(s.roe, 'percent')}
                    </td>
                    <td className={`p-4 border-b border-slate-100 text-right font-mono font-bold ${s.pbr <= 1.0 ? "text-rose-600" : "text-black"}`}>
                      {formatValue(s.pbr, 'ratio')}
                    </td>
                    <td className="p-4 border-b border-slate-100 text-center">
                      <button 
                        onClick={() => handleAnalysis(s.symbol)}
                        className="px-4 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-400 hover:border-black hover:text-black transition-all"
                      >
                        VIEW
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function FilterCategory({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-[11px] font-bold text-black uppercase tracking-widest flex items-center gap-2">
        <span className="w-1 h-1 bg-black rounded-full"></span>
        {title}
      </h3>
      <div className="space-y-4 pl-3">{children}</div>
    </div>
  );
}

function RangeInput({ label, minKey, maxKey, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] text-slate-400 font-bold uppercase">{label}</label>
      <div className="flex gap-2">
        <input 
          type="number" 
          placeholder="MIN" 
          value={value[minKey] || ""}
          onChange={(e) => onChange(minKey, e.target.value)}
          className="w-full bg-white border border-slate-200 rounded px-2 py-2 text-xs text-black outline-none focus:border-black transition-colors"
        />
        {maxKey && (
          <input 
            type="number" 
            placeholder="MAX" 
            value={value[maxKey] || ""}
            onChange={(e) => onChange(maxKey, e.target.value)}
            className="w-full bg-white border border-slate-200 rounded px-2 py-2 text-xs text-black outline-none focus:border-black transition-colors"
          />
        )}
      </div>
    </div>
  );
}
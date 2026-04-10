"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ScreeningPage() {
  const [market, setMarket] = useState<"JP" | "US">("JP");
  const [category, setCategory] = useState("dividend");
  const [selectedSector, setSelectedSector] = useState("");
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const SECTORS = [
    { id: "Technology", name: "💻 ハイテク", cycle: "回復期" },
    { id: "Financial Services", name: "🏦 金融", cycle: "金利上昇期" },
    { id: "Healthcare", name: "🏥 ヘルスケア", cycle: "不況期" },
    { id: "Consumer Cyclical", name: "🛍️ 一般消費財", cycle: "拡大期" },
    { id: "Energy", name: "🛢️ エネルギー", cycle: "インフレ期" },
    { id: "Utilities", name: "🔌 公共事業", cycle: "金利低下期" },
    { id: "Real Estate", name: "🏢 不動産", cycle: "金利低下期" },
    { id: "Communication Services", name: "📱 通信", cycle: "安定期" },
  ];

  useEffect(() => {
    fetchResults();
  }, [market, category, selectedSector]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const url = `http://localhost:8000/api/screener?market=${market}&category=${category}${selectedSector ? `&sector=${selectedSector}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setStocks(data);
    } catch (e) {
      console.error("Screening fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-black text-slate-200 overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* コントロールパネル (変更なし) */}
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Market & Strategy</label>
              <div className="flex gap-4">
                <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                  <button onClick={() => setMarket("JP")} className={`px-4 py-1.5 rounded-md text-[10px] font-black transition-all ${market === "JP" ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}>JAPAN</button>
                  <button onClick={() => setMarket("US")} className={`px-4 py-1.5 rounded-md text-[10px] font-black transition-all ${market === "US" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}>USA</button>
                </div>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-4 text-[10px] font-black text-white outline-none">
                  <option value="dividend">💰 高配当利回り順</option>
                  <option value="per">📉 低PBR（割安）順</option>
                  <option value="roe">💎 高ROE（バフェット流）</option>
                </select>
              </div>
            </div>
            <div className="space-y-2 flex-1 max-w-md">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sector Filter</label>
              <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-[11px] font-black text-white outline-none">
                <option value="">🌍 全業界を表示 (All Sectors)</option>
                {SECTORS.map(s => <option key={s.id} value={s.id}>{s.name} — {s.cycle}</option>)}
              </select>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white leading-none">{stocks.length}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Assets Filtered</p>
            </div>
          </div>
        </div>

        {/* 📊 結果テーブル：修正ポイント */}
        <div className="bg-slate-900/10 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800">
                  <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Ticker</th>
                  <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Company</th>
                  <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Sector</th>
                  <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">ROE</th>
                  <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Margin</th>
                  <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Yield</th>
                  {/* ✅ ヘッダーを PBR に変更 */}
                  <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">PBR</th>
                  <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan={8} className="p-24 text-center text-slate-600 font-black animate-pulse text-xs tracking-[0.3em]">ANALYZING...</td></tr>
                ) : (
                  stocks.map((s) => (
                    <tr key={s.symbol} className="hover:bg-blue-600/5 transition-all group">
                      <td className="p-4 text-xs font-mono font-bold text-blue-500">{s.symbol}</td>
                      <td className="p-4 text-xs font-bold text-slate-300 group-hover:text-white truncate max-w-[150px]">{s.name}</td>
                      <td className="p-4">
                        <span className="text-[9px] font-black px-2 py-0.5 bg-slate-800 rounded text-slate-500 uppercase">{s.sector}</span>
                      </td>
                      <td className={`p-4 text-xs font-mono font-bold text-right ${s.roe >= 15 ? "text-purple-400" : "text-slate-400"}`}>
                        {s.roe ? `${s.roe}%` : "---"}
                      </td>
                      <td className="p-4 text-xs font-mono font-bold text-right text-slate-400">
                        {s.margin ? `${s.margin}%` : "---"}
                      </td>
                      <td className="p-4 text-xs font-mono font-bold text-right text-green-500">
                        {s.dividendYield ? `${s.dividendYield}%` : "0%"}
                      </td>
                      {/* ✅ s.per ではなく s.pbr を表示 */}
                      <td className={`p-4 text-xs font-mono font-bold text-right ${s.pbr < 1.0 ? "text-green-400" : "text-yellow-500"}`}>
                        {s.pbr ? `${s.pbr}x` : "---"}
                      </td>
                      <td className="p-4 text-center">
                        <Link href={`/analysis?symbol=${s.symbol}`} className="inline-block text-[9px] font-black bg-slate-800 px-3 py-2 rounded-lg text-slate-400 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">
                          Analysis ↗
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
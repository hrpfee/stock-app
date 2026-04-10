// src/components/StockChart.tsx
import { 
  Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, AreaChart, Area, ReferenceLine, Label,
  Bar, Cell, ComposedChart
} from 'recharts';

export interface ChartConfig {
  ma5: boolean; ma25: boolean; ma75: boolean;
  bb: boolean; macd: boolean; rsi: boolean; volume: boolean;
}

interface Props {
  data: any[];
  isPositive: boolean;
  currency?: string;
  config: ChartConfig;
}

export default function StockChart({ data, isPositive, currency = "USD", config }: Props) {
  const mainColor = isPositive ? "#10b981" : "#ef4444";
  const currencySymbol = currency === "JPY" ? "¥" : "$";

  // 指標の表示数に応じて高さを調整（軸を表示するスペースを確保するため少し余裕を持たせる）
  const subChartCount = [config.macd, config.rsi].filter(Boolean).length;
  const mainHeight = subChartCount === 2 ? 'h-[48%]' : subChartCount === 1 ? 'h-[60%]' : 'h-[90%]';

  return (
    <div className="w-full h-full flex flex-col space-y-4 overflow-y-auto pr-1 custom-scrollbar">
      
      {/* 📈 1. メイン価格チャート（ここには必ず横軸を表示） */}
      <div className={`${mainHeight} w-full min-h-[300px] transition-all duration-300`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.2} />
            
            <XAxis 
              dataKey="date" 
              hide={false} // ✅ 絶対に表示する
              stroke="#94a3b8" // ✅ 少し明るくして見やすく
              fontSize={10}
              tickMargin={10}
              axisLine={{ stroke: '#334155' }}
              interval="preserveStartEnd"
              minTickGap={40}
              allowDuplicatedCategory={false}
            />
            
            <YAxis 
              domain={['auto', 'auto']} 
              stroke="#94a3b8" 
              fontSize={10}
              orientation="right"
              tickFormatter={(v) => `${currencySymbol}${v.toLocaleString()}`}
            />

            {config.volume && (
              <>
                <YAxis yAxisId="vol" hide domain={[0, (dataMax: any) => dataMax * 6]} />
                <Bar yAxisId="vol" dataKey="volume" fill="#94a3b8" opacity={0.05} />
              </>
            )}
            
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }} 
            />
            
            {config.bb && (
              <>
                <Line type="monotone" dataKey="bb_upper" stroke="#475569" strokeDasharray="5 5" dot={false} strokeWidth={1} opacity={0.4} />
                <Line type="monotone" dataKey="bb_lower" stroke="#475569" strokeDasharray="5 5" dot={false} strokeWidth={1} opacity={0.4} />
              </>
            )}

            {config.ma5 && <Line type="monotone" dataKey="ma5" stroke="#3b82f6" strokeWidth={1} dot={false} name="MA5" />}
            {config.ma25 && <Line type="monotone" dataKey="ma25" stroke="#eab308" strokeWidth={1} dot={false} name="MA25" />}
            {config.ma75 && <Line type="monotone" dataKey="ma75" stroke="#ec4899" strokeWidth={1} dot={false} name="MA75" />}
            
            <Line type="monotone" dataKey="price" stroke={mainColor} strokeWidth={2} dot={false} name="Price" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 📊 2. MACD チャート */}
      {config.macd && (
        <div className="h-28 w-full bg-slate-900/10 rounded-xl border border-slate-800/50 relative">
          <div className="absolute top-1 left-3 z-10">
            <span className="text-[8px] font-black text-slate-500 uppercase">MACD</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="date" hide={true} /> {/* メインで見れるのでサブは隠してスッキリさせる */}
              <YAxis hide domain={['auto', 'auto']} />
              <Bar dataKey="macd_hist">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.macd_hist >= 0 ? "#10b981" : "#ef4444"} fillOpacity={0.5} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="macd" stroke="#6366f1" dot={false} strokeWidth={1} />
              <Line type="monotone" dataKey="macd_signal" stroke="#f43f5e" dot={false} strokeWidth={1} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 📊 3. RSI チャート */}
      {config.rsi && (
        <div className="h-28 w-full bg-slate-900/10 rounded-xl border border-slate-800/50 relative">
          <div className="absolute top-1 left-3 z-10">
            <span className="text-[8px] font-black text-slate-500 uppercase">RSI (14)</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="date" hide={true} /> {/* メインで見れるのでサブは隠してスッキリさせる */}
              <YAxis domain={[0, 100]} orientation="right" fontSize={8} ticks={[30, 70]}>
                <Label value="RSI" angle={-90} position="insideRight" style={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }} />
              </YAxis>
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" opacity={0.3} />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" opacity={0.3} />
              <Area type="monotone" dataKey="rsi" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
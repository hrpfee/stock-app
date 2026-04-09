// src/components/StockChart.tsx
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, AreaChart, Area, ReferenceLine, Label 
} from 'recharts';

interface Props {
  data: any[];
  isPositive: boolean;
  currency?: string; // ✅ 通貨(USD/JPY)を受け取れるように追加
}

export default function StockChart({ data, isPositive, currency = "USD" }: Props) {
  const mainColor = isPositive ? "#10b981" : "#ef4444";

  // 通貨記号の判定
  const currencySymbol = currency === "JPY" ? "¥" : "$";

  return (
    <div className="w-full h-full flex flex-col space-y-2">
      {/* 📈 メイン価格チャート */}
      <div className="flex-[3] w-full min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
            
            <XAxis 
              dataKey="date" 
              stroke="#475569" 
              fontSize={10}
              tickMargin={10}
              interval="preserveStartEnd"
              hide={false}
            />
            
            <YAxis 
              domain={['auto', 'auto']} 
              stroke="#94a3b8" 
              fontSize={10}
              orientation="right"
              tickFormatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
            />
            
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ fontSize: '12px', padding: '2px 0' }}
            />
            
            {/* 💡 移動平均線 3本 */}
            <Line type="monotone" dataKey="ma5" stroke="#3b82f6" strokeWidth={1} dot={false} name="MA5 (Short)" />
            <Line type="monotone" dataKey="ma25" stroke="#eab308" strokeWidth={1} dot={false} name="MA25 (Mid)" />
            <Line type="monotone" dataKey="ma75" stroke="#ec4899" strokeWidth={1} dot={false} name="MA75 (Long)" />
            
            {/* メイン価格線 */}
            <Line type="monotone" dataKey="price" stroke={mainColor} strokeWidth={2.5} dot={false} name="Price" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 📊 RSI チャート */}
      <div className="flex-1 min-h-[120px] w-full bg-slate-900/20 rounded-xl relative border border-slate-800/50">
        <div className="absolute top-2 left-4 z-10">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Technical Indicator: RSI</span>
        </div>
        
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
            <XAxis dataKey="date" hide />
            <YAxis 
              domain={[0, 100]} 
              stroke="#475569" 
              fontSize={8} 
              orientation="right" 
              ticks={[30, 70]}
            >
              {/* ✅ RSIのラベルを軸に追加 */}
              <Label 
                value="RSI" 
                angle={-90} 
                position="insideRight" 
                style={{ textAnchor: 'middle', fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
              />
            </YAxis>
            
            {/* 基準線 (70: 買われすぎ / 30: 売られすぎ) */}
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
            
            <Area 
              type="monotone" 
              dataKey="rsi" 
              stroke="#fbbf24" 
              strokeWidth={1.5}
              fill="url(#colorRsi)" 
              fillOpacity={1} 
              name="RSI"
            />
            <defs>
              <linearGradient id="colorRsi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
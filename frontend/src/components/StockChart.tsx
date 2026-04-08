// src/components/StockChart.tsx
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, AreaChart, Area, ReferenceLine 
} from 'recharts';

interface Props {
  data: any[];
  isPositive: boolean;
}

export default function StockChart({ data, isPositive }: Props) {
  const mainColor = isPositive ? "#10b981" : "#ef4444";

  return (
    <div className="w-full h-full flex flex-col space-y-4">
    <div className="flex-1 w-full min-h-[400px]"> {/* ✅ flex-1 で親の高さに合わせる */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            
            {/* ✅ 横軸（日付/時刻）を表示 */}
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              fontSize={10}
              tickMargin={10}
              interval="preserveStartEnd" // 適切に間引いて表示
            />
            
            {/* ✅ 縦軸（価格）を表示 */}
            <YAxis 
              domain={['auto', 'auto']} 
              stroke="#94a3b8" 
              fontSize={10}
              orientation="right" // プロのチャートっぽく右側に配置
              tickFormatter={(value) => `$${value}`}
            />
            
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
            />
            
            <Line type="monotone" dataKey="ma25" stroke="#6366f1" strokeWidth={1} dot={false} strokeDasharray="3 3" name="MA25" />
            <Line type="monotone" dataKey="price" stroke={mainColor} strokeWidth={2} dot={false} name="Price" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 📊 RSI チャート */}
      <div className="h-24 w-full bg-slate-900/30 rounded-lg relative border border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <XAxis dataKey="date" hide />
            <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={8} orientation="right" ticks={[30, 70]} />
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="rsi" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
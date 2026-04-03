export default async function Home() {
  const API_KEY =process.env.ALPHA_VANTAGE_API_KEY;
  const symbol = 'AAPL'; 
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;

  // 1. データを注文する
  const res = await fetch(url);
  const data = await res.json();

  // 2. 届いたデータ（中身）を取り出す
  const price = data["Global Quote"]["05. price"];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-900 text-white">
      <h1 className="text-4xl font-bold mb-4">{symbol} の現在価格</h1>
      <div className="text-6xl font-mono text-green-400">
        ${parseFloat(price).toFixed(2)}
      </div>
    </main>
  );
}
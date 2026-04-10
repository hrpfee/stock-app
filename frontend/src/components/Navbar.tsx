"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "ホーム", href: "/" },
    { name: "チャート分析", href: "/analysis" },
    { name: "スクリーニング", href: "/screening" },
    { name: "決算日程", href: "/earnings" },
  ];

  return (
    <nav className="w-full h-14 bg-slate-950 border-b border-slate-800 flex items-center px-6 justify-between shrink-0 z-50">
      <div className="flex items-center gap-8">
        
        {/* ✅ 左上のアプリ名・ロゴ：クリックでホームに戻る */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer transition-all active:scale-95">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center font-black text-white text-xs shadow-lg shadow-blue-500/20 group-hover:bg-blue-500 transition-colors">
            G
          </div>
          <span className="font-black italic text-white tracking-tighter group-hover:text-blue-400 transition-colors">
            GEMINI TERMINAL
          </span>
        </Link>

        {/* ナビゲーションメニュー */}
        <div className="flex gap-1 h-full">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`px-4 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all
                ${pathname === item.href ? "text-blue-500 bg-blue-500/10" : "text-slate-500 hover:text-slate-200"}`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* 右側のステータス */}
      <div className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[8px] font-bold text-slate-500 tracking-widest">
        SYSTEM ONLINE
      </div>
    </nav>
  );
}
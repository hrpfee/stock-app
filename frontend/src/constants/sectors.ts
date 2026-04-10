// src/constants/sectors.ts

export type Sector = {
  label: string;  // 画面に表示する日本語
  value: string;  // DB(yfinance)に入っている英語
};

export const JP_SECTORS: Sector[] = [
  { label: "全業種", value: "" },
  { label: "テクノロジー", value: "Technology" },
  { label: "金融サービス", value: "Financial Services" },
  { label: "一般消費財", value: "Consumer Cyclical" },
  { label: "ヘルスケア", value: "Healthcare" },
  { label: "通信サービス", value: "Communication Services" },
  { label: "資本財", value: "Industrials" },
  { label: "生活必需品", value: "Consumer Defensive" },
  { label: "エネルギー", value: "Energy" },
  { label: "不動産", value: "Real Estate" },
  { label: "公共事業", value: "Utilities" },
  { label: "素材", value: "Basic Materials" },
];
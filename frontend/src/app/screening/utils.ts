// src/app/screening/utils.ts

/**
 * 数値を金融ツール風にフォーマットする
 * @param val フォーマット対象の数値
 * @param type 'percent' | 'ratio' | 'currency' | 'mcap'
 */
export const formatValue = (val: number | null | undefined, type: 'percent' | 'ratio' | 'currency' | 'mcap') => {
  if (val === null || val === undefined || isNaN(Number(val))) return "---";
  
  const num = Number(val);

  switch (type) {
    case 'percent':
      // 26.023... -> 26.02%
      return `${num.toFixed(2)}%`;
    
    case 'ratio':
      // 1.3939... -> 1.39x
      return `${num.toFixed(2)}x`;
    
    case 'mcap':
      // 時価総額: 21.53T (兆) / 850.5B (億円)
      if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
      if (num >= 1e8) return `${(num / 1e8).toFixed(1)}B`;
      return num.toLocaleString();

    case 'currency':
      // カンマ区切り
      return num.toLocaleString();

    default:
      return num.toString();
  }
};
import type { Product } from "./types";

/**
 * ⚠️ 這裡是 Demo 固定商品資料（核心）
 * 未來會改成 DB / 後台管理
 */

export const defaultProducts: Product[] = [
  {
    id: "p001",
    name: "恐龍綠色長袖上衣",
    price: 390,
    size: "S / M / L",
    status: "現貨",
    description: "舒適棉質，恐龍印花設計，日常穿搭好搭配",
    tags: ["休閒", "童裝", "印花"],
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop"
  },

  {
    id: "p002",
    name: "簡約白色護理風上衣",
    price: 490,
    size: "M / L",
    status: "預購",
    description: "簡約乾淨風格，適合日常與工作穿搭",
    tags: ["氣質", "清爽", "通勤"],
    image:
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=800&auto=format&fit=crop"
  },

  {
    id: "p003",
    name: "條紋休閒短袖上衣",
    price: 290,
    size: "S / M / L / XL",
    status: "現貨",
    description: "經典條紋款，輕鬆穿搭不出錯",
    tags: ["條紋", "休閒", "百搭"],
    image:
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=800&auto=format&fit=crop"
  }
];

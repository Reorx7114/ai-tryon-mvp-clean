import type { Product } from "./types";

export const defaultProducts: Product[] = [
  {
    id: "p001",
    name: "奶茶色針織外套",
    price: 890,
    size: "S / M / L",
    status: "現貨",
    image: "",
    tags: ["溫柔", "日常", "百搭"],
    description: "柔和奶茶色系，適合日常外出、冷氣房與輕正式場合。"
  },
  {
    id: "p002",
    name: "顯瘦黑色長洋裝",
    price: 1280,
    size: "M / L",
    status: "預購",
    image: "",
    tags: ["顯瘦", "聚會", "氣質"],
    description: "長版黑色洋裝，視覺修飾度高，適合聚會與正式場合。"
  },
  {
    id: "p003",
    name: "杏色雪紡上衣",
    price: 690,
    size: "S / M",
    status: "現貨",
    image: "",
    tags: ["通勤", "氣質", "清爽"],
    description: "輕柔雪紡材質，適合上班、約會與日常穿搭。"
  }
];

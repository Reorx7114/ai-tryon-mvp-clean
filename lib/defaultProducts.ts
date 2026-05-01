import { Product } from "./types";

export const defaultProducts: Product[] = [
  {
    id: "1",
    name: "柔軟字母亮點短袖針織衣",
    price: 699,
    size: "S / M / 現貨",
    status: "現貨",
    image:
      "https://images.unsplash.com/photo-1581044777550-4cfa60707c03",
    tags: ["通勤", "氣質", "清爽"],
    description: "柔軟舒適，日常百搭款"
  },
  {
    id: "2",
    name: "藍色針織外套",
    price: 1290,
    size: "M / L / 預購",
    status: "預購",
    image:
      "https://images.unsplash.com/photo-1520975916090-3105956dac38",
    tags: ["氣質", "顯瘦"],
    description: "秋冬百搭針織外套"
  }
];

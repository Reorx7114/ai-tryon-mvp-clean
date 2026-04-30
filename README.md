# AI Try-on MVP Clean

這是一個服飾電商用的 AI 試穿成交輔助 MVP。

目前版本重點不是串接真正 AI，而是先跑通顧客試穿與詢價流程。

## 功能

- 顧客端 `/`
  - 上傳顧客照片
  - 選擇商品
  - 產生 mock 試穿結果
  - 加入詢價單
  - 複製詢價內容

- 店主管理端 `/admin`
  - Demo 密碼：`admin123`
  - 新增商品
  - 上傳商品圖片
  - 編輯商品
  - 刪除商品
  - 重設預設商品

## 技術

- Next.js
- React
- TypeScript
- Tailwind CSS
- localStorage

## 啟動方式

```bash
npm install
npm run dev

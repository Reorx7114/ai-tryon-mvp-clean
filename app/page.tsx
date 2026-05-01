"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultProducts } from "@/lib/defaultProducts";
import type { InquiryItem, Product } from "@/lib/types";

const PRODUCTS_KEY = "ai-tryon-products";
const INQUIRY_KEY = "ai-tryon-inquiry";

function money(value: number) {
  return `NT$${value.toLocaleString("zh-TW")}`;
}

function loadProducts(): Product[] {
  if (typeof window === "undefined") return defaultProducts;

  try {
    const stored = window.localStorage.getItem(PRODUCTS_KEY);
    return stored ? JSON.parse(stored) : defaultProducts;
  } catch {
    return defaultProducts;
  }
}

function loadInquiry(): InquiryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(INQUIRY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [inquiry, setInquiry] = useState<InquiryItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [personPhoto, setPersonPhoto] = useState<string>("");
  const [resultImage, setResultImage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setProducts(loadProducts());
    setInquiry(loadInquiry());
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId]
  );

  function handlePhotoUpload(file?: File) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPersonPhoto(String(reader.result));
      setResultImage("");
    };
    reader.readAsDataURL(file);
  }

  async function generateTryOn() {
    if (!personPhoto) {
      alert("請先上傳人物照片");
      return;
    }

    if (!selectedProduct) {
      alert("請先選擇商品");
      return;
    }

    if (!selectedProduct.image) {
      alert("此商品尚未設定圖片，無法生成試穿圖");
      return;
    }

    try {
      setIsGenerating(true);
      setResultImage("");

      const response = await fetch("/api/tryon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personPhoto,
          garmentPhoto: selectedProduct.image,
          productName: selectedProduct.name,
          productDescription: selectedProduct.description,
          productTags: selectedProduct.tags
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "產生試穿圖失敗");
      }

      if (!result?.image) {
        throw new Error("沒有收到試穿圖");
      }

      setResultImage(result.image);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "產生試穿圖失敗");
    } finally {
      setIsGenerating(false);
    }
  }

  function addToInquiry(product: Product) {
    const item: InquiryItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      size: product.size,
      status: product.status,
      image: product.image
    };

    const next = inquiry.some((existing) => existing.id === product.id)
      ? inquiry
      : [...inquiry, item];

    setInquiry(next);
    window.localStorage.setItem(INQUIRY_KEY, JSON.stringify(next));
  }

  async function copyInquiry() {
    if (inquiry.length === 0) {
      alert("詢價單目前是空的");
      return;
    }

    const text = [
      "您好，我想詢問以下商品：",
      "",
      ...inquiry.map(
        (item, index) =>
          `${index + 1}. ${item.name}\n價格：${money(item.price)}\n尺寸：${item.size}\n狀態：${item.status}`
      )
    ].join("\n\n");

    await navigator.clipboard.writeText(text);
    alert("詢價內容已複製");
  }

  function clearInquiry() {
    setInquiry([]);
    window.localStorage.removeItem(INQUIRY_KEY);
  }

  return (
    <main className="min-h-screen px-5 py-8 text-stone-900 md:px-10">
      <section className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <div>
          <p className="mb-3 inline-flex rounded-full border border-orange-200 bg-white/70 px-4 py-2 text-sm font-bold text-orange-700">
            AI Try-on MVP
          </p>
          <h1 className="text-4xl font-black leading-tight md:text-6xl">
            不是展示 AI，
            <br />
            是幫顧客更快做購買判斷
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
            顧客自己上傳照片、選商品、產生試穿結果，並把喜歡的款式加入詢價單。
            目前這版會同時送出人物照與商品圖，提升人物相似度與服裝還原度。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#try"
              className="rounded-full bg-orange-600 px-6 py-3 font-black text-white shadow-lg shadow-orange-200"
            >
              開始試穿
            </a>
            <a
              href="/admin"
              className="rounded-full border border-orange-200 bg-white/80 px-6 py-3 font-black"
            >
              店主管理
            </a>
          </div>
        </div>

        <div className="rounded-[2rem] border border-orange-100 bg-white/80 p-6 shadow-2xl shadow-orange-100">
          <h2 className="text-2xl font-black">這版先做到三件事</h2>
          <div className="mt-5 grid gap-3">
            {[
              ["顧客端", "上傳人物照片、選商品、呼叫 API 產生試穿結果"],
              ["成交端", "加入詢價單、複製詢價內容，不強迫導 LINE"],
              ["店主端", "後台管理商品，資料先存在 localStorage"]
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-2xl border border-orange-100 bg-orange-50 p-4"
              >
                <strong>{title}</strong>
                <p className="mt-1 text-sm text-stone-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="try"
        className="mx-auto mt-12 grid max-w-7xl gap-5 lg:grid-cols-[0.9fr_1.25fr_0.85fr]"
      >
        <div className="rounded-3xl border border-orange-100 bg-white/85 p-5 shadow-xl shadow-orange-100">
          <h2 className="text-2xl font-black">1. 上傳自己的照片</h2>
          <div className="mt-4 grid min-h-[280px] place-items-center rounded-3xl border-2 border-dashed border-orange-200 bg-orange-50 p-4 text-center text-stone-500">
            {personPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={personPhoto}
                alt="顧客上傳照片"
                className="max-h-80 rounded-2xl object-contain"
              />
            ) : (
              <label className="cursor-pointer">
                <span className="font-bold">點這裡選擇照片</span>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-4 block w-full text-sm"
                  onChange={(event) =>
                    handlePhotoUpload(event.target.files?.[0])
                  }
                />
              </label>
            )}
          </div>
          {personPhoto && (
            <button
              className="mt-3 rounded-full border border-orange-200 bg-white px-4 py-2 font-bold"
              onClick={() => {
                setPersonPhoto("");
                setResultImage("");
              }}
            >
              重新上傳
            </button>
          )}
        </div>

        <div className="rounded-3xl border border-orange-100 bg-white/85 p-5 shadow-xl shadow-orange-100">
          <h2 className="text-2xl font-black">2. 選擇商品</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {products.map((product) => (
              <button
                key={product.id}
                className={`overflow-hidden rounded-3xl border-2 bg-white text-left shadow-md transition ${
                  selectedProductId === product.id
                    ? "border-orange-500 -translate-y-1"
                    : "border-transparent"
                }`}
                onClick={() => {
                  setSelectedProductId(product.id);
                  setResultImage("");
                }}
              >
                <div className="grid h-40 place-items-center bg-orange-100 text-3xl font-black text-orange-700">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    product.name.slice(0, 2)
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-black">{product.name}</h3>
                  <p className="mt-1 font-black text-orange-700">
                    {money(product.price)}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    尺寸：{product.size}｜{product.status}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {!product.image && (
                    <p className="mt-3 text-xs font-bold text-red-500">
                      此商品尚未設定圖片，無法生成試穿圖
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            className="mt-5 rounded-full bg-orange-600 px-6 py-3 font-black text-white shadow-lg shadow-orange-200"
            onClick={generateTryOn}
          >
            {isGenerating ? "AI 試穿生成中..." : "產生試穿圖"}
          </button>

          <div className="mt-5 grid min-h-[320px] place-items-center rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5 text-center">
            {isGenerating && (
              <p className="font-bold text-stone-500">
                正在產生試穿結果，請稍候...
              </p>
            )}

            {!isGenerating && !resultImage && (
              <p className="text-stone-500">
                請先上傳照片並選擇商品，再按下產生試穿圖
              </p>
            )}

            {!isGenerating && resultImage && selectedProduct && (
              <div className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
                <div className="grid overflow-hidden rounded-2xl bg-orange-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resultImage}
                    alt="AI 試穿結果"
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="mt-4 text-xl font-black">試穿結果已完成</h3>
                <p className="mt-1 text-stone-600">
                  {selectedProduct.name}｜{money(selectedProduct.price)}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    className="rounded-2xl border border-orange-200 bg-white px-4 py-3 font-black"
                    onClick={() => addToInquiry(selectedProduct)}
                  >
                    加入詢價單
                  </button>
                  <button
                    className="rounded-2xl bg-stone-900 px-4 py-3 font-black text-white"
                    onClick={() => addToInquiry(selectedProduct)}
                  >
                    我要詢問
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-3xl border border-orange-100 bg-white/85 p-5 shadow-xl shadow-orange-100">
          <h2 className="text-2xl font-black">3. 詢價單</h2>
          <div className="mt-4 min-h-[220px] rounded-3xl border border-orange-100 bg-orange-50 p-4">
            {inquiry.length === 0 ? (
              <p className="text-stone-500">尚未加入商品</p>
            ) : (
              <div className="grid gap-3">
                {inquiry.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-white p-3 shadow-sm">
                    <strong>{item.name}</strong>
                    <p className="text-sm text-stone-500">
                      {money(item.price)}｜{item.size}｜{item.status}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            className="mt-4 w-full rounded-full bg-orange-600 px-5 py-3 font-black text-white"
            onClick={copyInquiry}
          >
            複製詢價內容
          </button>
          <button
            className="mt-3 w-full rounded-full border border-orange-200 bg-white px-5 py-3 font-black"
            onClick={clearInquiry}
          >
            清空詢價單
          </button>
        </aside>
      </section>
    </main>
  );
}

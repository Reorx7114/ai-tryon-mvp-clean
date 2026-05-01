"use client";

import { useMemo, useState } from "react";
import { defaultProducts } from "@/lib/defaultProducts";
import type { Product } from "@/lib/types";

function money(value: number) {
  return `NT$${value.toLocaleString("zh-TW")}`;
}

export default function HomePage() {
  const [products] = useState<Product[]>(defaultProducts);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [personPhoto, setPersonPhoto] = useState<string>("");
  const [resultImage, setResultImage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
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
    if (!personPhoto || !selectedProduct) {
      alert("請先上傳照片並選擇商品");
      return;
    }

    try {
      setIsGenerating(true);
      setResultImage("");

      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personPhoto,
          garmentPhoto: selectedProduct.image,
          productName: selectedProduct.name,
          productDescription: selectedProduct.description,
          productTags: selectedProduct.tags,
          productCategory: "top"
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setResultImage(data.image);
    } catch (err) {
      alert("試穿失敗，請再試一次");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <h1 className="text-4xl font-black">
          AI試穿，幫你少踩雷
        </h1>
        <p className="mt-2 text-stone-500">
          上傳你的照片，看看這件衣服穿在你身上長怎樣
        </p>

        {/* Upload */}
        <div className="mt-8 rounded-2xl border p-6">
          <h2 className="font-bold">1. 上傳你的照片</h2>

          <div className="mt-4">
            {personPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={personPhoto} className="h-64 rounded-lg object-contain" />
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handlePhotoUpload(e.target.files?.[0])
                }
              />
            )}
          </div>
        </div>

        {/* Products */}
        <div className="mt-10">
          <h2 className="font-bold">2. 選擇商品</h2>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
            {products.map((p) => (
              <div
                key={p.id}
                className={`cursor-pointer rounded-xl border p-3 ${
                  selectedProductId === p.id
                    ? "border-black"
                    : "border-gray-200"
                }`}
                onClick={() => {
                  setSelectedProductId(p.id);
                  setResultImage("");
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  className="h-40 w-full rounded-lg object-cover"
                />
                <p className="mt-2 font-bold">{p.name}</p>
                <p className="text-sm text-gray-500">
                  {money(p.price)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Generate */}
        <div className="mt-8">
          <button
            onClick={generateTryOn}
            className="rounded-xl bg-black px-6 py-3 font-bold text-white"
          >
            {isGenerating ? "生成中..." : "開始試穿"}
          </button>
        </div>

        {/* Result */}
        <div className="mt-10">
          {isGenerating && <p>AI生成中...</p>}

          {resultImage && selectedProduct && (
            <div className="max-w-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultImage}
                className="rounded-xl"
              />

              <div className="mt-4">
                <p className="font-bold text-lg">
                  {selectedProduct.name}
                </p>
                <p className="text-gray-500">
                  {money(selectedProduct.price)}
                </p>

                {/* 🔥 關鍵：導購 */}
                <a
                  href={
                    selectedProduct.shopeeUrl ||
                    "https://shopee.tw"
                  }
                  target="_blank"
                  className="mt-4 block rounded-xl bg-orange-500 px-4 py-3 text-center font-bold text-white"
                >
                  立即前往購買
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

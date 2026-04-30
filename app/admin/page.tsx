"use client";

import { useEffect, useState } from "react";
import { defaultProducts } from "@/lib/defaultProducts";
import type { Product } from "@/lib/types";

const PRODUCTS_KEY = "ai-tryon-products";
const PASSWORD = "admin123";

function money(value: number) {
  return `NT$${value.toLocaleString("zh-TW")}`;
}

function createEmptyProduct(): Product {
  return {
    id: crypto.randomUUID(),
    name: "",
    price: 0,
    size: "",
    status: "現貨",
    image: "",
    tags: [],
    description: ""
  };
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

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [draft, setDraft] = useState<Product>(createEmptyProduct());
  const [editingId, setEditingId] = useState<string>("");

  useEffect(() => {
    setProducts(loadProducts());
  }, []);

  function persist(nextProducts: Product[]) {
    setProducts(nextProducts);
    window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(nextProducts));
  }

  function login() {
    if (password !== PASSWORD) {
      alert("密碼錯誤");
      return;
    }

    setIsLoggedIn(true);
  }

  function handleImageUpload(file?: File) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setDraft((current) => ({
        ...current,
        image: String(reader.result)
      }));
    };
    reader.readAsDataURL(file);
  }

  function saveProduct() {
    if (!draft.name.trim() || !draft.price || !draft.size.trim()) {
      alert("請填寫商品名稱、價格與尺寸");
      return;
    }

    const normalized: Product = {
      ...draft,
      name: draft.name.trim(),
      size: draft.size.trim(),
      status: draft.status.trim() || "現貨",
      tags: draft.tags.filter(Boolean),
      description: draft.description.trim()
    };

    const nextProducts = editingId
      ? products.map((product) => (product.id === editingId ? normalized : product))
      : [normalized, ...products];

    persist(nextProducts);
    setDraft(createEmptyProduct());
    setEditingId("");
  }

  function editProduct(product: Product) {
    setEditingId(product.id);
    setDraft(product);
  }

  function deleteProduct(id: string) {
    if (!window.confirm("確定刪除此商品？")) return;

    const nextProducts = products.filter((product) => product.id !== id);
    persist(nextProducts);

    if (editingId === id) {
      setEditingId("");
      setDraft(createEmptyProduct());
    }
  }

  function resetProducts() {
    if (!window.confirm("確定重設回預設商品？")) return;

    persist(defaultProducts);
    setDraft(createEmptyProduct());
    setEditingId("");
  }

  if (!isLoggedIn) {
    return (
      <main className="grid min-h-screen place-items-center px-5 py-10">
        <section className="w-full max-w-md rounded-3xl border border-orange-100 bg-white/90 p-6 shadow-2xl shadow-orange-100">
          <p className="mb-3 inline-flex rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
            店主管理區
          </p>
          <h1 className="text-3xl font-black">請輸入管理密碼</h1>
          <p className="mt-3 text-stone-600">
            Demo 密碼：<strong>admin123</strong>
          </p>
          <input
            type="password"
            className="mt-5 w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 outline-none"
            placeholder="輸入管理密碼"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            className="mt-4 w-full rounded-full bg-orange-600 px-5 py-3 font-black text-white"
            onClick={login}
          >
            進入後台
          </button>
          <a
            href="/"
            className="mt-4 block text-center text-sm font-bold text-orange-700"
          >
            回顧客試穿頁
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-8 text-stone-900 md:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
              Admin
            </p>
            <h1 className="text-4xl font-black">商品後台</h1>
            <p className="mt-2 text-stone-600">
              這裡先用 localStorage 儲存商品；正式版可再換成資料庫與真正登入系統。
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/"
              className="rounded-full border border-orange-200 bg-white px-5 py-3 font-black"
            >
              回試穿頁
            </a>
            <button
              className="rounded-full border border-red-200 bg-white px-5 py-3 font-black text-red-600"
              onClick={() => setIsLoggedIn(false)}
            >
              登出
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-orange-100 bg-white/90 p-5 shadow-xl shadow-orange-100">
            <h2 className="text-2xl font-black">
              {editingId ? "編輯商品" : "新增商品"}
            </h2>

            <label className="mt-5 block font-bold">
              商品照片
              <input
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-sm"
                onChange={(event) => handleImageUpload(event.target.files?.[0])}
              />
            </label>

            <div className="mt-4 grid min-h-48 place-items-center overflow-hidden rounded-3xl border border-orange-100 bg-orange-50">
              {draft.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.image} alt="商品照片預覽" className="max-h-60 w-full object-cover" />
              ) : (
                <p className="text-stone-500">尚未上傳商品照</p>
              )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="font-bold">
                商品名稱
                <input
                  className="mt-2 w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 outline-none"
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  placeholder="例：奶茶色針織外套"
                />
              </label>

              <label className="font-bold">
                價格
                <input
                  type="number"
                  className="mt-2 w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 outline-none"
                  value={draft.price || ""}
                  onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })}
                  placeholder="例：890"
                />
              </label>

              <label className="font-bold">
                尺寸
                <input
                  className="mt-2 w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 outline-none"
                  value={draft.size}
                  onChange={(event) => setDraft({ ...draft, size: event.target.value })}
                  placeholder="例：S / M / L"
                />
              </label>

              <label className="font-bold">
                狀態
                <input
                  className="mt-2 w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 outline-none"
                  value={draft.status}
                  onChange={(event) => setDraft({ ...draft, status: event.target.value })}
                  placeholder="例：現貨 / 預購"
                />
              </label>
            </div>

            <label className="mt-4 block font-bold">
              標籤，用逗號分隔
              <input
                className="mt-2 w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 outline-none"
                value={draft.tags.join(",")}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    tags: event.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                  })
                }
                placeholder="例：溫柔,日常,百搭"
              />
            </label>

            <label className="mt-4 block font-bold">
              商品說明
              <textarea
                className="mt-2 min-h-28 w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 outline-none"
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                placeholder="材質、版型、穿搭建議"
              />
            </label>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-orange-600 px-6 py-3 font-black text-white"
                onClick={saveProduct}
              >
                儲存商品
              </button>
              <button
                className="rounded-full border border-orange-200 bg-white px-6 py-3 font-black"
                onClick={() => {
                  setDraft(createEmptyProduct());
                  setEditingId("");
                }}
              >
                清空
              </button>
              <button
                className="rounded-full border border-red-200 bg-white px-6 py-3 font-black text-red-600"
                onClick={resetProducts}
              >
                重設預設商品
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-orange-100 bg-white/90 p-5 shadow-xl shadow-orange-100">
            <h2 className="text-2xl font-black">商品列表</h2>
            <div className="mt-5 grid gap-4">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="grid gap-4 rounded-3xl border border-orange-100 bg-orange-50 p-4 sm:grid-cols-[120px_1fr_auto]"
                >
                  <div className="grid h-28 place-items-center overflow-hidden rounded-2xl bg-white text-xl font-black text-orange-700">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      product.name.slice(0, 2)
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-black">{product.name}</h3>
                    <p className="mt-1 font-black text-orange-700">{money(product.price)}</p>
                    <p className="mt-1 text-sm text-stone-600">
                      尺寸：{product.size}｜{product.status}
                    </p>
                    <p className="mt-2 text-sm text-stone-500">{product.description}</p>
                  </div>

                  <div className="flex gap-2 sm:flex-col">
                    <button
                      className="rounded-full border border-orange-200 bg-white px-4 py-2 font-bold"
                      onClick={() => editProduct(product)}
                    >
                      編輯
                    </button>
                    <button
                      className="rounded-full border border-red-200 bg-white px-4 py-2 font-bold text-red-600"
                      onClick={() => deleteProduct(product.id)}
                    >
                      刪除
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

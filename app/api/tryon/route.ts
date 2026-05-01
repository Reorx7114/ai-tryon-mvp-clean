import { NextResponse } from "next/server";

export const runtime = "nodejs";

function dataUrlToBlob(dataUrl: string) {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!matches) {
    throw new Error("無效的圖片資料格式");
  }

  const mimeType = matches[1];
  const base64 = matches[2];
  const buffer = Buffer.from(base64, "base64");

  return new Blob([buffer], { type: mimeType });
}

function safeText(value: unknown, fallback = "未提供") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "伺服器尚未設定 OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      personPhoto,
      garmentPhoto,
      productName,
      productDescription,
      productTags,
      productCategory
    } = body;

    if (!personPhoto) {
      return NextResponse.json({ error: "缺少人物照片" }, { status: 400 });
    }

    if (!garmentPhoto) {
      return NextResponse.json(
        { error: "缺少商品照片，請先替商品設定圖片" },
        { status: 400 }
      );
    }

    const personImage = dataUrlToBlob(personPhoto);
    const garmentImage = dataUrlToBlob(garmentPhoto);

    const tagsText = Array.isArray(productTags)
      ? productTags.filter(Boolean).join("、")
      : "未提供";

    const nameText = safeText(productName);
    const descriptionText = safeText(productDescription);
    const categoryText = safeText(productCategory, "上衣");

    const prompt = `
你是一個電商 AI 試穿修圖助手。請根據「第一張人物照片」與「第二張商品照片」產生試穿預覽圖。

重要圖片定義：
- 第一張圖片：顧客本人照片，只能作為人物、臉、身體、姿勢、背景來源。
- 第二張圖片：商品照片，是唯一允許參考的服裝來源。
- 不可以自行想像其他衣服。
- 不可以使用與第二張商品照片不一致的顏色、條紋、圖案、字母、Logo、版型或材質。

最高優先規則：
只把第一張人物照片中「原本穿著的服裝」替換成第二張商品照片中的服裝。
請盡量保持原照片像是同一張照片被局部改衣服，而不是重新生成新照片。

絕對禁止修改：
- 臉
- 五官
- 臉型
- 表情
- 膚色
- 髮型
- 髮色
- 手部
- 姿勢
- 背景
- 拍攝角度
- 鏡頭距離
- 配件
- 手上拿的物品
- 證件、項鍊、手錶、包包等非服裝物件

人物保留要求：
- 第一張照片中的人必須仍然是同一個人。
- 不要美化成另一個人。
- 不要改成棚拍模特兒。
- 不要讓臉變成 AI 感。
- 保留原始照片的光線、真實感與生活照質感。

服裝替換要求：
- 第二張商品照片是唯一服裝參考。
- 必須忠實保留商品的主色、條紋、花紋、圖案、字母、材質、領口、袖型、長度與版型。
- 若商品圖上有明顯文字或圖案，例如英文字、恐龍、條紋、印花，請盡量保留其視覺特徵。
- 不要產生商品圖不存在的條紋、顏色、圖案或設計。
- 不要把商品變成另一種衣服。
- 上衣不可變洋裝。
- 外套不可變裙子。
- 若商品是上衣，只修改人物上半身衣服，保留下半身原本狀態。
- 衣服需要自然貼合人物身形、肩線、手臂與姿勢。
- 皺褶、布料垂墜與陰影要自然。

如果第一張人物照片中的原服裝和第二張商品服裝類型不同：
- 仍以第二張商品照片為準。
- 只替換合理服裝區域。
- 不要修改不相關身體區域。

輸出要求：
- 產生自然、真實、可用於電商試穿預覽的照片。
- 保留原圖構圖。
- 不要加入水印。
- 不要加入額外文字。
- 不要生成拼貼圖。
- 不要生成多張圖。
- 不要生成商品展示圖。
- 只輸出試穿後的人物照片。

商品資訊：
商品名稱：${nameText}
商品分類：${categoryText}
商品描述：${descriptionText}
商品標籤：${tagsText}
`;

    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("image[]", personImage, "person.png");
    formData.append("image[]", garmentImage, "garment.png");
    formData.append("prompt", prompt);
    formData.append("size", "1024x1024");
    formData.append("input_fidelity", "high");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("OpenAI image edit error:", result);

      return NextResponse.json(
        {
          error: result?.error?.message || "OpenAI 產生圖片失敗",
          detail: result
        },
        { status: response.status }
      );
    }

    const b64 = result?.data?.[0]?.b64_json;

    if (!b64) {
      return NextResponse.json(
        { error: "OpenAI 沒有回傳圖片資料" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      image: `data:image/png;base64,${b64}`
    });
  } catch (error) {
    console.error("tryon route error:", error);

    return NextResponse.json(
      { error: "伺服器處理失敗，請確認圖片格式與商品資料是否正確" },
      { status: 500 }
    );
  }
}

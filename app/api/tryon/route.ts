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
      productTags
    } = body;

    if (!personPhoto) {
      return NextResponse.json(
        { error: "缺少人物照片" },
        { status: 400 }
      );
    }

    if (!garmentPhoto) {
      return NextResponse.json(
        { error: "缺少商品照片，請先到後台替商品上傳圖片" },
        { status: 400 }
      );
    }

    const personImage = dataUrlToBlob(personPhoto);
    const garmentImage = dataUrlToBlob(garmentPhoto);

    const tagsText = Array.isArray(productTags)
      ? productTags.join("、")
      : "";

    const prompt = `
請編修「第一張人物照片」，生成試穿圖。

【🚨 絕對規則（最高優先）】
- 必須是同一個人
- 臉部完全不可改變
- 不可重新生成臉
- 不可美化或改風格
- 必須保留原始臉部細節（五官、比例、膚色、表情）

【🔒 完全鎖定（禁止修改）】
- 臉
- 頭髮（髮型、髮色）
- 背景
- 姿勢
- 手
- 身上配件（包包、杯子、飾品）

【👕 唯一允許修改】
- 僅限「衣服區域」

【👗 服裝規則（嚴格）】
- 完全依照商品圖
- 保留顏色、條紋、材質、版型、長度
- 不可新增設計
- 不可改變衣服種類
- 上衣不可變洋裝
- 不可影響下半身（若商品是上衣）

【🧠 生成邏輯】
- 這是一張「編修圖」
- 不是生成新照片
- 必須保留原始照片的真實感

【✨ 品質要求】
- 衣服自然貼合人體
- 保留原始光影
- 保留身形比例
- 避免過度平滑或AI感

【📦 輸入說明】
第一張圖：人物照片（主體，必須保留）
第二張圖：商品衣服（服裝參考）

商品名稱：${productName || "無"}
商品描述：${productDescription || "無"}
商品標籤：${tagsText || "無"}
`;

    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("image[]", personImage, "person.png");
    formData.append("image[]", garmentImage, "garment.png");
    formData.append("prompt", prompt);
    formData.append("size", "1024x1024");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
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
      { error: "伺服器處理失敗" },
      { status: 500 }
    );
  }
}

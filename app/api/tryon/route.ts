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
請編修「第一張人物照片」，而不是生成新的人。

【身份鎖定（最高優先）】
1. 必須保留同一個人，不可更換臉。
2. 保留臉型、五官、髮型、髮色、膚色、表情、氣質。
3. 保留姿勢、構圖、背景、手部位置、配件（包包、杯子等）。

【修改限制】
4. 只能修改服裝區域，其它區域不得變動。
5. 不可改臉、頭髮、背景、手、配件。
6. 不可把上衣變洋裝，不可改變服裝類型。

【服裝依據】
7. 服裝必須完全依照「商品圖」：
   - 顏色
   - 材質
   - 版型
   - 領口
   - 袖型
   - 長度
8. 不可新增商品圖沒有的設計。

【輸出】
9. 生成自然、真實的電商試穿圖。
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
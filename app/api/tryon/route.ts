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

    if (!productName) {
      return NextResponse.json(
        { error: "缺少商品名稱" },
        { status: 400 }
      );
    }

    const personImage = dataUrlToBlob(personPhoto);
    const garmentImage = dataUrlToBlob(garmentPhoto);
    const tagsText = Array.isArray(productTags) ? productTags.join("、") : "";

    const prompt = `
你會收到兩張參考圖片：

第一張圖片：人物照片。
第二張圖片：商品服裝照片。

請根據這兩張圖片生成一張自然、真實、適合服飾電商展示的 AI 試穿結果圖。

核心目標：
讓第一張人物照片中的同一個人，穿上第二張商品照片中的同一件服裝。

人物保留要求：
1. 必須保留第一張人物照片中的人物身份特徵。
2. 請盡量保留原人物的臉型、五官、髮型、膚色、氣質、身形比例與整體感覺。
3. 不要把人物換成另一個陌生模特兒。
4. 不要明顯改變人物年齡、臉部輪廓、髮型或神情。
5. 可以為了試穿效果做自然修飾，但人物必須看起來仍是同一個人。

服裝還原要求：
1. 必須嚴格參考第二張商品照片中的服裝。
2. 請保留商品服裝的顏色、版型、衣長或裙長、領口、袖型、材質觀感與整體款式。
3. 不要任意更換服裝類型。
4. 不要把洋裝改成襯衫、套裝、上衣或其他款式。
5. 如果商品是露肩、平口、一字領、無袖或貼身設計，必須保留這些特徵。
6. 如果商品照片是白色露肩洋裝，請保留白色、露肩、洋裝與原始版型，不可改成白色襯衫式洋裝。
7. 不要自行加上商品圖中不存在的袖子、襯衫領、排扣、外套或其他配件。

畫面要求：
1. 生成結果要像真實電商試穿照片。
2. 人物自然清楚，服裝清楚可見。
3. 背景乾淨自然，不要喧賓奪主。
4. 不要加入文字、水印、Logo、價格標籤或多餘裝飾。
5. 以「讓消費者判斷這件商品穿在自己身上的感覺」為目的。

商品資訊：
商品名稱：${productName}
商品說明：${productDescription || "無"}
商品標籤：${tagsText || "無"}
`;

    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("image[]", personImage, "person-photo.png");
    formData.append("image[]", garmentImage, "garment-photo.png");
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

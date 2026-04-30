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
      customerPhoto,
      productName,
      productDescription,
      productTags
    } = body;

    if (!customerPhoto) {
      return NextResponse.json(
        { error: "缺少顧客照片" },
        { status: 400 }
      );
    }

    if (!productName) {
      return NextResponse.json(
        { error: "缺少商品名稱" },
        { status: 400 }
      );
    }

    const customerImage = dataUrlToBlob(customerPhoto);
    const tagsText = Array.isArray(productTags) ? productTags.join("、") : "";

    const prompt = `
請編修這張顧客照片，產生一張自然、真實、適合服飾電商展示的試穿效果圖。

要求：
1. 保留原本人物的臉部特徵、髮型、姿勢與整體人物感覺。
2. 讓人物穿上符合以下商品描述的服裝。
3. 整體風格自然、寫實、乾淨，不要過度誇張。
4. 以「服飾試穿展示」為目的，讓成品看起來像完成試穿的成果圖。
5. 如果原始背景不影響畫面，可保留簡潔背景；若需要，可稍微整理成乾淨自然的背景。

商品名稱：${productName}
商品說明：${productDescription || "無"}
商品標籤：${tagsText || "無"}
`;

    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("image", customerImage, "customer-photo.png");
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
          error:
            result?.error?.message || "OpenAI 產生圖片失敗",
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

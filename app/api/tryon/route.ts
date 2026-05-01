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
請對第一張人物照片做「局部服裝編修」，不是重新生成新照片。

最高優先目標：
保留第一張照片中的同一個人，只把服裝換成第二張商品圖的服裝。

絕對禁止：
- 不要換臉。
- 不要重畫臉。
- 不要美化成另一個人。
- 不要改變五官、臉型、眼睛、鼻子、嘴巴、膚色、表情。
- 不要改變髮型、髮色。
- 不要改變背景、姿勢、手部、包包、杯子、配件。
- 不要把人物改成棚拍模特兒。
- 不要改變原照片的構圖與鏡頭距離。

允許修改的唯一區域：
只修改人物身上的服裝區域。

人物保留要求：
- 臉必須看起來仍是原圖中的同一個人。
- 保留原本臉部辨識度。
- 保留原本表情與氣質。
- 保留原本身形比例與姿勢。
- 保留原本光影與照片感。

服裝要求：
- 第二張商品圖是唯一服裝參考。
- 忠實保留商品的顏色、條紋、花紋、材質、領口、袖型、長度、版型。
- 不可新增商品圖不存在的設計。
- 不可改變衣服種類。
- 上衣不可變洋裝。
- 外套不可變成連身裙。
- 若商品是上衣或外套，只修改上半身，保留下半身原本服裝。
- 若原圖有裙子、褲子、腿部，除非商品本身是下半身服裝，否則不要修改。

輸出要求：
- 自然、真實、可用於電商試穿預覽。
- 衣服要自然貼合人體。
- 保留原照片背景與真實感。
- 不要生成文字、水印、Logo 或多餘裝飾。

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

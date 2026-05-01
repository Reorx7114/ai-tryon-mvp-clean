import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function dataUrlToBlob(dataUrl: string) {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!matches) {
    throw new Error("無效的圖片資料格式");
  }

  const mimeType = matches[1];
  const base64 = matches[2];

  if (!SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
    throw new Error("圖片格式不支援，請使用 JPG、PNG 或 WEBP");
  }

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
這是一個服飾電商 AI 試穿任務。

請編修「第一張人物照片」，不是重新生成新照片。
第一張圖是人物照片，是主要目標圖。
第二張圖是商品服裝照片，只作為服裝參考。

【最高優先：保留人物】
- 必須保留第一張圖中的同一個人。
- 不要換臉。
- 不要重新生成臉。
- 不要美化成另一個人。
- 保留原本臉型、五官、眼睛、鼻子、嘴巴、膚色、表情與氣質。
- 保留原本髮型、髮色、姿勢、手部位置、身形比例、背景與構圖。
- 保留手上物品、包包、飾品、杯子或其他配件。

【唯一允許修改】
- 只允許修改人物身上的服裝區域。
- 不要修改臉、頭髮、背景、手、配件、包包、杯子。
- 不要重新繪製整張照片。

【商品圖限制】
- 第二張商品圖是唯一服裝依據。
- 必須忠實保留商品圖中可見的：
  - 顏色
  - 版型
  - 領口
  - 袖型
  - 長度
  - 材質
  - 圖案
  - 印花
  - 文字
  - Logo
  - 角色圖案
  - 條紋方向
  - 刺繡或特殊裝飾
- 不可以把商品圖中不存在的款式自行加入。
- 不可以把圖案簡化成條紋。
- 不可以把印花、文字、恐龍、角色圖案改成素面或通用花紋。
- 不可以把商品重新設計成另一件衣服。
- 不可以因為商品圖不清楚，就改成一般條紋衣、素色衣、襯衫、洋裝或其他通用服裝。

【不確定時的處理規則】
如果商品圖不夠清楚、背景複雜、有人穿著、或模型無法完整辨識服裝：
- 寧可保守地保留原人物服裝結構。
- 只做小幅、可辨識的服裝顏色與表面圖案替換。
- 不要自行創造新款式。
- 不要把商品改成完全不同的衣服。
- 不要把上衣改成洋裝。
- 不要把短版上衣延伸成長版衣。
- 不要把小孩衣服、上衣或外套改成成人條紋服裝。

【商品類型規則】
- 如果商品是上衣、T-shirt、針織衣、外套、背心、小可愛、襯衫：
  - 只修改上半身服裝。
  - 保留下半身原本服裝。
  - 不要改褲子、裙子、腿部。
  - 不要變成洋裝或連身衣。
- 如果商品是外套：
  - 讓人物穿上外套。
  - 保留外套顏色、鈕扣、花紋、刺繡、胸針、材質感。
  - 不要把外套變成襯衫或洋裝。
- 只有商品明確是洋裝時，才可以生成洋裝。

【安全規則】
- 人物必須始終穿著衣服。
- 不要生成裸體、內衣、泳裝或裸露內容。
- 不要讓服裝變得更暴露。
- 如果服裝參考可能造成裸露風險，請改成保守、日常、完整穿著的服裝效果。

【輸出要求】
- 生成自然、真實、可用於電商試穿預覽的圖片。
- 保留原照片光影與真實感。
- 衣服要自然貼合人體。
- 不要加入文字、水印、價格標籤或多餘裝飾。
- 不要生成多個人物。
- 不要生成拼貼圖。

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
      {
        error:
          error instanceof Error
            ? error.message
            : "伺服器處理失敗"
      },
      { status: 500 }
    );
  }
}

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
    const { personPhoto, garmentPhoto, productName, productDescription, productTags } = body;

    if (!personPhoto) {
      return NextResponse.json(
        { error: "缺少人物照片" },
        { status: 400 }
      );
    }
    if (!garmentPhoto) {
      return NextResponse.json(
        { error: "缺少商品照片" },
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
你會收到兩張圖片，請務必執行「照片編修」而不是「重生新人物」。
- 第一張是人物照（personPhoto）：這是主要目標圖與構圖基準。
- 第二張是商品照（garmentPhoto）：只用來參考服裝款式。

核心原則（最高優先）：
1. 必須保留第一張人物照中的同一個人，不可替換成陌生模特兒。
2. 臉部與身份一致性必須最高：保留原本臉型、五官、髮型、髮色、膚色、表情、年齡感與整體氣質。
3. 保留原始姿勢、身形比例、手部位置、拍攝角度、鏡頭距離、背景、光線與構圖。
4. 保留原本配件與手上物品（例如包包、手機、咖啡杯、飾品），不要刪除或替換。

編修範圍限制：
5. 只修改人物身上的服裝區域，其他區域盡量保持與人物照一致。
6. 不要重畫臉、頭髮、背景、手與配件，不要新增披肩、外套或其他遮擋物。
7. 若商品是「上衣/襯衫/背心/小可愛/外套/針織外套」，只改上半身服裝；保留下半身原本穿著。
8. 若商品是上衣類，禁止把上衣延伸成洋裝、長版上衣或連身裙。
9. 只有當商品本身是洋裝或下半身服裝時，才可以改動下半身服裝。

服裝還原規則：
10. 商品照是唯一服裝依據，必須忠實保留顏色、花紋、材質、版型、長度、領口、袖型、貼合度與露肩/平口等關鍵特徵。
11. 不可增加商品圖中不存在的袖子、領子、裙長、鈕扣、刺繡、胸針或其他裝飾。
12. 若商品是露肩或平口款，必須保留露肩/平口，不可改成襯衫領或包覆肩膀的款式。
13. 若商品是外套或針織外套，應呈現「穿上外套」效果，並盡量保留原本內搭邏輯（除非商品照明顯是完整套裝）。

輸出風格：
14. 請輸出自然真實的顧客試穿照，不要變成棚拍模特兒形象照。

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

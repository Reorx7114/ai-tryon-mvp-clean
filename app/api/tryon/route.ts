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

第一張圖片：人物照片，這是最重要的主體參考。
第二張圖片：商品服裝照片，這是服裝款式參考。

請產生一張「同一位人物」穿上「同一件商品服裝」的 AI 試穿結果圖。

最高優先規則：
1. 第一張人物照片中的人物身份必須被保留。
2. 不要把人物重生成另一個陌生模特兒。
3. 不要改變人物的臉型、五官、髮型、膚色、年齡感、身形比例、姿勢與整體氣質。
4. 盡量保留原始照片的構圖、鏡頭距離、人物角度與背景感。
5. 只替換需要試穿的服裝區域，不要重畫整個人。

人物保留要求：
- 保留原人物的臉部辨識度。
- 保留原人物的髮型與髮色。
- 保留原人物的表情與氣質。
- 保留原人物的身形比例與姿勢。
- 不要把人物變成更年輕、更成熟、不同種族、不同臉型或不同風格的模特兒。
- 不要自動改成棚拍模特兒風格。
- 不要過度美化到不像本人。

服裝試穿要求：
- 第二張商品照片是唯一的服裝款式依據。
- 必須忠實保留商品的顏色、版型、衣長或裙長、領口、袖型、肩帶、材質觀感與整體款式。
- 不要任意更換服裝類型。
- 不要把商品改成襯衫、套裝、外套、長裙、禮服或其他不存在的款式。
- 不要自行新增袖子、襯衫領、排扣、腰帶、外套、披肩或其他配件。
- 不要把短版上衣延伸成長版衣。
- 不要把小可愛、背心、細肩帶上衣、平口上衣、露肩上衣變成洋裝。
- 不要把上半身商品腦補成全身連身裙或長版洋裝。

如果商品是上衣類、背心、小可愛、細肩帶上衣、平口上衣或露肩上衣：
1. 只替換人物上半身服裝。
2. 保留人物原本的下半身服裝。
3. 保留原本腰線與上下身比例。
4. 不要把上衣延伸到大腿、膝蓋或腳踝。
5. 不要生成全身洋裝、長版上衣、連身裙或禮服。
6. 如果原人物照片中可見褲子、裙子或腿部，請保持它們不被服裝覆蓋或改寫。

如果商品是洋裝：
1. 才可以替換成連身洋裝。
2. 必須忠實保留商品照片中的裙長、領口、袖型、肩線與版型。
3. 如果商品是露肩洋裝，必須保留露肩或平口特徵，不可改成襯衫領、短袖或長袖洋裝。

畫面要求：
- 生成結果要像自然、真實的電商試穿照片。
- 人物清楚、服裝清楚、比例自然。
- 背景乾淨但不要過度改變原始照片背景。
- 不要加入文字、水印、Logo、價格標籤或多餘裝飾。
- 不要生成多個人物。
- 不要生成拼貼圖。
- 不要改變成商品棚拍圖。
- 目標是讓消費者判斷「這件商品穿在自己身上的感覺」。

商品資訊：
商品名稱：${productName}
商品說明：${productDescription || "無"}
商品標籤：${tagsText || "無"}

請依據商品照片判斷它是上衣、洋裝、外套或其他類型。
若商品照片看起來是短版上衣、小可愛、背心、細肩帶上衣、平口上衣或露肩上衣，請嚴格依照「只替換上半身」規則處理。
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

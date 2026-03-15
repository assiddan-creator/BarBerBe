import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { normalizeWomenAnalysis } from "@/lib/women-analysis";
import { WOMEN_PRESETS } from "@/lib/women-presets";

export const runtime = "nodejs";

const WOMEN_V1_PRESETS = WOMEN_PRESETS.filter((p) => p.phase === "v1");
const WOMEN_PRESET_IDS = new Set(WOMEN_V1_PRESETS.map((p) => p.id));

const WOMEN_ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    hairTexture: {
      type: SchemaType.STRING,
      enum: ["straight", "wavy", "curly", "coily", "unknown"],
    },
    frizzLevel: {
      type: SchemaType.STRING,
      enum: ["low", "medium", "high"],
    },
    volumeLevel: {
      type: SchemaType.STRING,
      enum: ["low", "medium", "high"],
    },
    drynessLevel: {
      type: SchemaType.STRING,
      enum: ["low", "medium", "high"],
    },
    heatStylingFit: {
      type: SchemaType.STRING,
      enum: ["low", "medium", "high"],
    },
    maintenanceFit: {
      type: SchemaType.STRING,
      enum: ["low", "medium", "high"],
    },
    confidence: {
      type: SchemaType.STRING,
      enum: ["low", "medium", "high"],
    },
    topRecommendedStyles: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description:
        "Array of 2–4 preset IDs strictly from the allowed v1 list, best fit first.",
    },
    personalSummaryHe: {
      type: SchemaType.STRING,
      description:
        "סיכום קצר בעברית שמסביר ללקוחה מה מצב השיער שלה ומה הכיוון שהסטייליסטית ממליצה לו.",
    },
  },
  required: [
    "hairTexture",
    "frizzLevel",
    "volumeLevel",
    "drynessLevel",
    "heatStylingFit",
    "maintenanceFit",
    "confidence",
    "topRecommendedStyles",
  ],
} as const;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 },
    );
  }

  let body: { imageUrl?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const imageUrl = body?.imageUrl;
  if (!imageUrl || typeof imageUrl !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid imageUrl" },
      { status: 400 },
    );
  }

  if (
    !imageUrl.startsWith("http://") &&
    !imageUrl.startsWith("https://") &&
    !imageUrl.startsWith("data:")
  ) {
    return NextResponse.json(
      { error: "imageUrl must be an HTTP, HTTPS, or data URL" },
      { status: 400 },
    );
  }

  // Fetch image and convert to base64 for Gemini vision input.
  let base64Image: string | null = null;
  let mimeType: string | null = null;
  try {
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error(
        `[barber/women/analyze] Image fetch failed with status ${imageRes.status}`,
      );
    }
    mimeType = imageRes.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await imageRes.arrayBuffer();
    base64Image = Buffer.from(arrayBuffer).toString("base64");
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to fetch image for analysis";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const presetIds = Array.from(WOMEN_PRESET_IDS).join(", ");

  const prompt = `
את מתפקדת כספרית ומעצבת שיער ברמה הגבוהה ביותר בישראל, עם ניסיון עמוק בפתרון יומיומי ואמיתי לשיער של לקוחות אמיתיות – לא רק תמונות אינסטגרם.

מולך לקוחה אחת, עם סלפי קדמי אחד (התמונה מצורפת). המשימה שלך:
1. לנתח בקצרה ובצורה מקצועית מה מצב השיער שלה כרגע.
2. להעריך את רמת הטקסטורה, הפריז, הנפח, היובש וההתאמה לעיצוב בחום.
3. לבחור עבורה כמה תספורות/כיוונים מתוך רשימת פריסטים קיימת בלבד (phase v1).
4. לנסח לה משפטי הסבר קצרים, מקצועיים ומחזקים – בלי שיפוט ובלי שיח יופי שיווקי.

סגנון כתיבה:
- מקצועי מאוד אבל בגובה העיניים.
- מחמאה מותרת רק אם היא מבוססת נתונים מקצועיים (צפיפות, טקסטורה, תנועה, פוטנציאל לעיצוב).
- אין לשפוט מראה, משקל, גיל, יופי, גזרה, או כל מאפיין אישי.
- השפה היא עברית טבעית של מעצבת שיער ישראלית מנוסה.

דברים להסתכל עליהם בתמונה:
- מרקם השיער: חלק / גלי / מתולתל / לא ברור.
- רמת פריז: נמוכה / בינונית / גבוהה.
- רמת נפח: נמוכה / בינונית / גבוהה.
- רמת יובש נראית: נמוכה / בינונית / גבוהה (לפי ברק, קצוות, תחושה כללית).
- כמה ריאלי להחזיק עיצוב עם חום (פן/מחליק/בייביליס) ביום־יום.

פריסטים מותרים (topRecommendedStyles – השתמשי רק במזהים מהרשימה הבאה, phase === "v1"):
${presetIds}

מטרת ה-JSON:
- לתת ניתוח שיער תמציתי אבל מקצועי.
- לבחור 2–4 סגנונות מהרשימה בלבד שמתאימים במיוחד למה שרואים.
- לנסח סיכום קצר בעברית שגורם ללקוחה להרגיש שמבינים את השיער שלה ונותנים לה כיוון אמיתי.

השדות שאת חייבת למלא:
- hairTexture: "straight" | "wavy" | "curly" | "coily" | "unknown"
- frizzLevel: "low" | "medium" | "high"
- volumeLevel: "low" | "medium" | "high"
- drynessLevel: "low" | "medium" | "high"
- heatStylingFit: "low" | "medium" | "high"
- maintenanceFit: "low" | "medium" | "high"
- confidence: "low" | "medium" | "high"
- topRecommendedStyles: מערך של 2 עד 4 מזהי פריסטים מתוך הרשימה למעלה, לפי סדר התאמה (הכי מתאים ראשון).
- personalSummaryHe: 1–2 משפטים קצרים בעברית, בגוף שני, שמתארים ללקוחה:
  - מה רואים בשיער שלה (טקסטורה / פריז / נפח) במילים פשוטות ומכבדות.
  - איזה כיוון תספורת וסגנון ירגיש לה נכון לשגרה שלה.

חשוב מאוד:
- החזירי תשובה אחת בלבד בפורמט JSON שממלא את כל השדות לפי הסכמה.
- אל תוסיפי טקסט מחוץ ל-JSON.
`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: WOMEN_ANALYSIS_SCHEMA as any,
      },
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Image!,
                mimeType: mimeType!,
              },
            },
          ],
        },
      ],
    });

    const response = await result.response;
    const text = response.text();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Analysis did not return any content" },
        { status: 502 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Analysis did not return valid JSON" },
        { status: 502 },
      );
    }

    const normalized = normalizeWomenAnalysis(parsed);

    const filteredStyles = normalized.topRecommendedStyles.filter((id) =>
      WOMEN_PRESET_IDS.has(id),
    );
    normalized.topRecommendedStyles = filteredStyles.slice(0, 4);

    return NextResponse.json({ analysis: normalized });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Analysis request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}


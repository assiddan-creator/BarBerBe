import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import {
  normalizeAnalysisOutput,
  filterValidPresetIds,
} from "@/lib/barber-analysis";
import { HAIRSTYLE_PRESETS, BEARD_PRESETS } from "@/lib/barber-presets";

export const runtime = "nodejs";

const HAIRSTYLE_IDS = new Set(HAIRSTYLE_PRESETS.map((p) => p.id));
const BEARD_IDS = new Set(BEARD_PRESETS.map((p) => p.id));
const HAIRSTYLE_MAP = new Map(HAIRSTYLE_PRESETS.map((p) => [p.id, p]));
const BEARD_MAP = new Map(BEARD_PRESETS.map((p) => [p.id, p]));

/**
 * Local fallback for a short Hebrew personal summary when the
 * remote model does not provide one.
 */
function buildLocalPersonalSummaryHe(analysis: {
  beardCompatibilityHe: string;
  topRecommendedHairstyles: string[];
  topRecommendedBeards: string[];
}): string | undefined {
  const firstHairId = analysis.topRecommendedHairstyles[0];
  const firstBeardId = analysis.topRecommendedBeards[0];
  const hairPreset = firstHairId ? HAIRSTYLE_MAP.get(firstHairId) : undefined;
  const beardPreset = firstBeardId ? BEARD_MAP.get(firstBeardId) : undefined;

  const hairLabel = hairPreset?.displayNameHe || hairPreset?.nameHe;
  const beardLabel = beardPreset?.displayNameHe || beardPreset?.nameHe;

  if (!hairLabel && !beardLabel) {
    if (analysis.beardCompatibilityHe) {
      return `הניתוח מצביע על התאמה ${analysis.beardCompatibilityHe.toLowerCase()} יחסית לזקן, עם כיוון כללי ללוק מסודר ומותאם לשגרה.`;
    }
    return undefined;
  }

  const parts: string[] = [];

  if (hairLabel && beardLabel) {
    parts.push(
      `הניתוח מציע כיוון שמחבר בין ${hairLabel} לבין ${beardLabel} כלוק מרכזי.`,
    );
  } else if (hairLabel) {
    parts.push(`הניתוח מציע להתמקד קודם כל בלוק של ${hairLabel}.`);
  } else if (beardLabel) {
    parts.push(`הניתוח מציע לשמור את הזקן בסגנון ${beardLabel} כלוק מוביל.`);
  }

  if (analysis.beardCompatibilityHe) {
    parts.push(
      `התאמת הזקן מוערכת כ${analysis.beardCompatibilityHe.toLowerCase()}, כך שהכיוון נשאר מעשי ונוח לתחזוקה.`,
    );
  }

  return parts.join(" ");
}

/**
 * Structured output schema for Gemini: includes the core analysis fields
 * plus the Hebrew enrichment fields.
 */
const ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    gender: {
      type: SchemaType.STRING,
      description: "Detected gender of the person in the photo from facial/visual cues.",
      enum: ["male", "female"],
    },
    beardCompatibility: {
      type: SchemaType.STRING,
      description: 'Overall beard compatibility: "low" | "medium" | "high"',
      enum: ["low", "medium", "high"],
    },
    beardCompatibilityHe: {
      type: SchemaType.STRING,
      description:
        "תיאור קצר בעברית של התאמת הזקן למראה הכללי (משפט אחד קצר).",
    },
    topRecommendedHairstyles: {
      type: SchemaType.ARRAY,
      description:
        "Array of 2–4 hairstyle preset IDs (strings) from the allowed list, best first.",
      items: { type: SchemaType.STRING },
    },
    topRecommendedBeards: {
      type: SchemaType.ARRAY,
      description:
        "Array of 2–4 beard preset IDs (strings) from the allowed list, best first.",
      items: { type: SchemaType.STRING },
    },
    confidence: {
      type: SchemaType.STRING,
      description: 'Overall confidence: "low" | "medium" | "high"',
      enum: ["low", "medium", "high"],
    },
    hairType: {
      type: SchemaType.STRING,
      description: "Hair texture / type: straight, wavy, or curly.",
      enum: ["straight", "wavy", "curly"],
    },
    personalSummaryHe: {
      type: SchemaType.STRING,
      description:
        "סיכום אישי קצר בעברית שמדבר ישירות ללקוח על איך השיער והזקן שלו נראים ומה הכיוון הכללי.",
    },
    styleReasonHe: {
      type: SchemaType.STRING,
      description:
        "הסבר קצר בעברית למה כיוון התספורת/הזקן שאתה מציע מתאים למה שרואים בתמונה.",
    },
    maintenanceDirectionHe: {
      type: SchemaType.STRING,
      description:
        "הסבר קצר בעברית על רמת התחזוקה המומלצת (קלה/בינונית/גבוהה) ואיך זה נראה בשגרה.",
    },
  },
  required: [
    "gender",
    "hairType",
    "beardCompatibility",
    "beardCompatibilityHe",
    "topRecommendedHairstyles",
    "topRecommendedBeards",
    "confidence",
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

  // Fetch the image and convert to base64 for Gemini vision input.
  let base64Image: string | null = null;
  let mimeType: string | null = null;
  try {
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error(`Image fetch failed with status ${imageRes.status}`);
    }
    mimeType = imageRes.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await imageRes.arrayBuffer();
    base64Image = Buffer.from(arrayBuffer).toString("base64");
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to fetch image for analysis";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const hairstyleIds = HAIRSTYLE_PRESETS.map((p) => p.id).join(", ");
  const beardIds = BEARD_PRESETS.map((p) => p.id).join(", ");

  const prompt = `
החל מעכשיו, אתה מתפקד בתור מעצב שיער לגברים ברמה הגבוהה ביותר בישראל – בסגנון שמזכיר ספרים כמו ארז אברהם ומאסטרים מובילים אחרים. אתה מומחה לטקסטורות, דירוגים מודרניים (Fade), והתאמה של שיער וזקן למבנה הפנים.

אתה מקבל: סלפי אחד של לקוח (התמונה מצורפת), יחד עם רשימת פריסטים אפשריים לשיער ולזקן. המשימה שלך היא לתת ניתוח מקצועי, אישי ועדין, בלי להיות רובוטי.

טון וסגנון:
- עברית טבעית של ספר ישראלי מנוסה, בגובה העיניים אבל ברמה מקצועית גבוהה.
- מותר להחמיא בעדינות על נתונים מקצועיים בלבד (טקסטורה, צפיפות, גוונים, נוכחות זקן) – לא על יופי כללי.
- בלי הגזמות, בלי יותר מדי סימני קריאה, בלי סופרלטיבים ריקים.
- כתיבה זורמת, כאילו אתה מדבר עם הלקוח בכיסא.

הנחיות לאבחון:
- התייחס למבנה הפנים, לצללית הכללית, לטקסטורת השיער (חלק/גלי/מתולתל), לצפיפות ולאופן שבו הזקן צומח.
- התמקד בנתונים שאתה באמת יכול להעריך מתמונה אחת קדמית.

הנחיות לבחירת פריסטים:
- בחר 2–4 פריסטים לתסרוקת ו-2–4 פריסטים לזקן מתוך הרשימות הבאות בלבד.
- סדר הפריסטים צריך להיות לפי התאמה – הטוב ביותר ראשון.

פריסטים מותרים לשיער (topRecommendedHairstyles – השתמש רק במחרוזות מהרשימה הבאה):
${hairstyleIds}

פריסטים מותרים לזקן (topRecommendedBeards – השתמש רק במחרוזות מהרשימה הבאה):
${beardIds}

על בסיס התמונה וההנחיות, הפק ניתוח אחד מסודר שממלא את השדות הבאים:

- gender: "male" | "female" — זהה את המין של האדם בתמונה (גבר או אישה) על פי המראה והמאפיינים הויזואליים.
- hairType: "straight" | "wavy" | "curly" — טקסטורת השיער (חלק, גלי, מתולתל).
- beardCompatibility: "low" | "medium" | "high"
- beardCompatibilityHe: תיאור קצר בעברית של התאמת הזקן למראה הכללי.
- topRecommendedHairstyles: מערך של 2 עד 4 מזהי פריסטים לשיער מתוך הרשימה בלבד, בסדר עדיפות.
- topRecommendedBeards: מערך של 2 עד 4 מזהי פריסטים לזקן מתוך הרשימה בלבד, בסדר עדיפות.
- confidence: "low" | "medium" | "high"

בנוסף, הפק גם טקסטים קצרים בעברית:
- personalSummaryHe: 1–2 משפטים אישיים שמסכמים ללקוח איך השיער והזקן שלו נראים ומה הכיוון הכללי שאתה מציע.
- styleReasonHe: משפט אחד שמסביר למה הכיוון שבחרת לשיער ולזקן מתאים למבנה הפנים ולנתוני הפתיחה.
- maintenanceDirectionHe: משפט אחד שמפרט מה רמת התחזוקה המתאימה (קלה/בינונית/גבוהה) ואיך זה ירגיש בשגרה (תדירות ביקור במספרה, מאמץ יומיומי).

חשוב מאוד:
- החזר תשובה אחת בלבד בפורמט JSON שממלא את כל השדות לפי הסכמה המבוקשת.
- אל תוסיף טקסט מחוץ ל-JSON.
`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA as any,
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

    const analysis = normalizeAnalysisOutput(parsed);
    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis result could not be validated" },
        { status: 502 },
      );
    }

    analysis.topRecommendedHairstyles = filterValidPresetIds(
      analysis.topRecommendedHairstyles,
      HAIRSTYLE_IDS,
      5,
    );
    analysis.topRecommendedBeards = filterValidPresetIds(
      analysis.topRecommendedBeards,
      BEARD_IDS,
      5,
    );

    if (!analysis.personalSummaryHe) {
      const summary = buildLocalPersonalSummaryHe(analysis);
      if (summary) {
        analysis.personalSummaryHe = summary;
      }
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Analysis request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

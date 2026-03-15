import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import {
  normalizeAnalysisOutput,
  filterValidPresetIds,
} from "@/lib/barber-analysis";
import { HAIRSTYLE_PRESETS, BEARD_PRESETS } from "@/lib/barber-presets";

export const runtime = "nodejs";

const HAIRSTYLE_IDS = new Set(HAIRSTYLE_PRESETS.map((p) => p.id));
const BEARD_IDS = new Set(BEARD_PRESETS.map((p) => p.id));

// IMPORTANT: For apples-to-apples testing, this prompt must match the live route.
const SYSTEM_PROMPT = `You produce structured JSON for a grooming analysis task. Return only valid JSON.`;

const USER_PROMPT = (() => {
  const hairstyleIds = HAIRSTYLE_PRESETS.map((p) => p.id).join(", ");
  const beardIds = BEARD_PRESETS.map((p) => p.id).join(", ");
  return (
    "Analyze one anonymous frontal selfie for men's grooming recommendations.\n\n" +
    "Use only clearly visible grooming-related cues:\n" +
    "- hair texture\n" +
    "- visible hair density\n" +
    "- beard growth visibility\n" +
    "- overall maintenance direction\n\n" +
    "Do not identify the person.\n" +
    "Do not describe sensitive or non-grooming traits.\n\n" +
    "Return exactly ONE valid JSON object and nothing else.\n\n" +
    "Required JSON keys:\n" +
    '- \"beardCompatibility\": \"low\" | \"medium\" | \"high\"\\n' +
    '- \"beardCompatibilityHe\": short label in Hebrew for the beard compatibility level\\n' +
    '- \"topRecommendedHairstyles\": array of 2 to 4 valid hairstyle preset ids, best fit first\\n' +
    '- \"topRecommendedBeards\": array of 2 to 4 valid beard preset ids, best fit first\\n' +
    '- \"confidence\": \"low\" | \"medium\" | \"high\"\\n\\n' +
    "Valid hairstyle preset ids (use ONLY these exact strings):\n" +
    hairstyleIds +
    "\n\n" +
    "Valid beard preset ids (use ONLY these exact strings):\n" +
    beardIds +
    "\n\n" +
    "Rules:\n" +
    "- JSON only\n" +
    "- No markdown\n" +
    "- No explanation\n" +
    "- No apology\n" +
    "- No refusal text"
  );
})();

function extractJsonFromText(text: string): { parsed: unknown; raw: string } {
  const trimmed = text.trim();
  try {
    return { parsed: JSON.parse(trimmed) as unknown, raw: trimmed };
  } catch {
    // continue
  }
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    try {
      return {
        parsed: JSON.parse(codeBlock[1].trim()) as unknown,
        raw: codeBlock[1].trim(),
      };
    } catch {
      // continue
    }
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const slice = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return { parsed: JSON.parse(slice) as unknown, raw: slice };
    } catch {
      // continue
    }
  }
  return { parsed: null, raw: trimmed };
}

function isRefusalText(text: string): boolean {
  const lower = text.toLowerCase();
  const patterns = [
    "i'm sorry",
    "i am sorry",
    "i can\u2019t help",
    "i can't help",
    "cannot help",
    "can't assist",
    "cannot assist",
    "can't provide",
    "cannot provide",
    "analyzing photos of people",
    "analysing photos of people",
    "analyzing images of people",
    "analysing images of people",
    "photo of a person",
    "identify",
    "identifying",
    "face recognition",
    "facial recognition",
  ];
  return patterns.some((p) => lower.includes(p));
}

export async function POST(request: NextRequest) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN is not configured" },
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

  const replicate = new Replicate({ auth: token });

  try {
    const combinedPrompt = `${SYSTEM_PROMPT}\n\n${USER_PROMPT}`;

    const output = (await replicate.run(
      "lucataco/qwen2-vl-7b-instruct:bf57361c75677fc33d480d0c5f02926e621b2caa2000347cb74aeae9d2ca07ee",
      {
        input: {
          media: imageUrl,
          prompt: combinedPrompt,
          max_new_tokens: 400,
        },
      },
    )) as unknown;

    if (output == null || (Array.isArray(output) && output.length === 0)) {
      return NextResponse.json(
        { error: "Alt analysis did not return any content" },
        { status: 502 },
      );
    }

    let text = "";
    if (Array.isArray(output)) {
      text = output
        .map((chunk) =>
          typeof chunk === "string" ? chunk : String(chunk ?? ""),
        )
        .join("");
    } else if (typeof output === "string") {
      text = output;
    } else {
      return NextResponse.json(
        { error: "Unexpected alt analysis response format" },
        { status: 502 },
      );
    }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Alt analysis returned empty text" },
        { status: 502 },
      );
    }

    if (isRefusalText(text)) {
      return NextResponse.json(
        { error: "Alt analysis model refused this request" },
        { status: 502 },
      );
    }

    const { parsed, raw } = extractJsonFromText(text);
    if (!parsed) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(
          "[barber/analyze-alt] JSON parse failed. Preview:",
          raw.slice(0, 200),
        );
      }
      return NextResponse.json(
        { error: "Alt analysis did not return valid JSON" },
        { status: 502 },
      );
    }

    const analysis = normalizeAnalysisOutput(parsed);
    if (!analysis) {
      return NextResponse.json(
        { error: "Alt analysis result could not be validated" },
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

    return NextResponse.json({ analysis });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Alt analysis request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}


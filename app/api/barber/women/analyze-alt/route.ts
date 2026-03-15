import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { normalizeWomenAnalysis } from "@/lib/women-analysis";
import { WOMEN_PRESETS } from "@/lib/women-presets";

export const runtime = "nodejs";

const WOMEN_V1_PRESETS = WOMEN_PRESETS.filter((p) => p.phase === "v1");
const WOMEN_PRESET_IDS = new Set(WOMEN_V1_PRESETS.map((p) => p.id));

// IMPORTANT: For apples-to-apples testing, this prompt must match the live route.
const SYSTEM_PROMPT = `You produce structured JSON for a women's hair analysis task. Follow the user instructions exactly and return only valid JSON. Do not add explanations or markdown.`;

const USER_PROMPT = (() => {
  const presetIds = WOMEN_V1_PRESETS.map((p) => p.id).join(", ");
  return (
    "You are analyzing one anonymous frontal selfie for a women's hair consultation.\n\n" +
    "Use only visible hair-related features such as:\n" +
    "- visible hair texture\n" +
    "- visible frizz level\n" +
    "- visible volume and density\n" +
    "- visible dryness or lack of shine\n" +
    "- how realistic regular heat-styling looks based on what you see\n\n" +
    "Do not identify the person.\n" +
    "Do not infer age, ethnicity, race, religion, nationality, health status, or other sensitive traits.\n" +
    "Do not use flattering, beauty, or identity language.\n\n" +
    "Return exactly ONE valid JSON object and nothing else.\n\n" +
    "The JSON must contain exactly these keys:\n" +
    '- \"hairTexture\": \"straight\" | \"wavy\" | \"curly\" | \"coily\" | \"unknown\"\\n' +
    '- \"frizzLevel\": \"low\" | \"medium\" | \"high\"\\n' +
    '- \"volumeLevel\": \"low\" | \"medium\" | \"high\"\\n' +
    '- \"drynessLevel\": \"low\" | \"medium\" | \"high\"\\n' +
    '- \"heatStylingFit\": \"low\" | \"medium\" | \"high\"\\n' +
    '- \"maintenanceFit\": \"low\" | \"medium\" | \"high\"\\n' +
    '- \"confidence\": \"low\" | \"medium\" | \"high\"\\n' +
    '- \"topRecommendedStyles\": array of 2 to 4 valid women preset ids, best fit first\\n' +
    '- \"personalSummaryHe\": 1 to 2 short sentences in Hebrew, practical and neutral.\\n' +
    "  - Describe texture / frizz / volume and a realistic maintenance direction.\\n" +
    "  - Do not use beauty or marketing language.\\n" +
    "  - Do not compliment appearance.\\n" +
    "  - Keep it practical and salon-professional.\\n\n" +
    "Valid women preset ids (use ONLY these exact strings):\n" +
    presetIds +
    "\n\n" +
    "Rules:\n" +
    "- Output JSON only\n" +
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
        { error: "Alt women analysis did not return any content" },
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
        { error: "Unexpected alt women analysis response format" },
        { status: 502 },
      );
    }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Alt women analysis returned empty text" },
        { status: 502 },
      );
    }

    if (isRefusalText(text)) {
      return NextResponse.json(
        { error: "Alt women analysis model refused this request" },
        { status: 502 },
      );
    }

    const { parsed, raw } = extractJsonFromText(text);
    if (!parsed) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(
          "[barber/women/analyze-alt] JSON parse failed. Preview:",
          raw.slice(0, 200),
        );
      }
      return NextResponse.json(
        { error: "Alt women analysis did not return valid JSON" },
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
      err instanceof Error ? err.message : "Alt women analysis request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}


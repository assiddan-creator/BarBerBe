import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const runtime = "nodejs";

type ExperimentalMenAnalysisResult = {
  beardCompatibility: "low" | "medium" | "high";
  beardCompatibilityHe: string;
  topRecommendedHairstyles: string[];
  topRecommendedBeards: string[];
  confidence: "low" | "medium" | "high";
  personalSummaryHe: string;
  styleReasonHe: string;
  maintenanceDirectionHe: string;
};

const SYSTEM_PROMPT = `You are a premium men's grooming analysis engine for a hairstyling consultation product. Return only valid JSON.`;

const USER_PROMPT = `
Analyze one anonymous frontal selfie for men's grooming recommendations.

Return exactly one valid JSON object and nothing else.

Required JSON keys:
- "beardCompatibility": "low" | "medium" | "high"
- "beardCompatibilityHe": short Hebrew label
- "topRecommendedHairstyles": array of 2 to 4 valid hairstyle preset ids
- "topRecommendedBeards": array of 2 to 4 valid beard preset ids
- "confidence": "low" | "medium" | "high"
- "personalSummaryHe": 1 short Hebrew sentence
- "styleReasonHe": 1 short Hebrew sentence
- "maintenanceDirectionHe": 1 short Hebrew sentence
`;

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

  const replicate = new Replicate({ auth: token });

  try {
    const combinedPrompt = `${SYSTEM_PROMPT}\n\n${USER_PROMPT}\n\nImage URL: ${imageUrl}`;

    const output = (await replicate.run(
      "deepseek-ai/deepseek-vl2:e5caf557dd9e5dcee46442e1315291ef1867f027991ede8ff95e304d4f734200",
      {
        input: {
          image: imageUrl,
          prompt: combinedPrompt,
        },
      },
    )) as unknown;

    let text = "";
    if (Array.isArray(output)) {
      text = output
        .map((chunk) =>
          typeof chunk === "string" ? chunk : String(chunk ?? ""),
        )
        .join("");
    } else if (typeof output === "string") {
      text = output;
    } else if (
      typeof output === "object" &&
      (output as any).output &&
      typeof (output as any).output === "string"
    ) {
      text = (output as any).output as string;
    } else {
      return NextResponse.json(
        { error: "Unexpected DeepSeek response format" },
        { status: 502 },
      );
    }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "DeepSeek returned empty text" },
        { status: 502 },
      );
    }

    const { parsed, raw } = extractJsonFromText(text);
    if (!parsed) {
      return NextResponse.json(
        {
          error: "DeepSeek did not return valid JSON",
          raw,
        },
        { status: 502 },
      );
    }

    const o = parsed as Record<string, unknown>;

    const beardCompatibility =
      o.beardCompatibility === "low" ||
      o.beardCompatibility === "medium" ||
      o.beardCompatibility === "high"
        ? (o.beardCompatibility as ExperimentalMenAnalysisResult["beardCompatibility"])
        : "medium";

    const confidence =
      o.confidence === "low" ||
      o.confidence === "medium" ||
      o.confidence === "high"
        ? (o.confidence as ExperimentalMenAnalysisResult["confidence"])
        : "medium";

    const topRecommendedHairstyles = Array.isArray(o.topRecommendedHairstyles)
      ? (o.topRecommendedHairstyles as unknown[]).filter(
          (id) => typeof id === "string",
        )
      : [];

    const topRecommendedBeards = Array.isArray(o.topRecommendedBeards)
      ? (o.topRecommendedBeards as unknown[]).filter(
          (id) => typeof id === "string",
        )
      : [];

    const experimental: ExperimentalMenAnalysisResult = {
      beardCompatibility,
      beardCompatibilityHe:
        typeof o.beardCompatibilityHe === "string"
          ? o.beardCompatibilityHe
          : "",
      topRecommendedHairstyles: topRecommendedHairstyles.slice(0, 4) as string[],
      topRecommendedBeards: topRecommendedBeards.slice(0, 4) as string[],
      confidence,
      personalSummaryHe:
        typeof o.personalSummaryHe === "string" ? o.personalSummaryHe : "",
      styleReasonHe:
        typeof o.styleReasonHe === "string" ? o.styleReasonHe : "",
      maintenanceDirectionHe:
        typeof o.maintenanceDirectionHe === "string"
          ? o.maintenanceDirectionHe
          : "",
    };

    return NextResponse.json({ analysis: experimental, raw });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "DeepSeek experimental request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}


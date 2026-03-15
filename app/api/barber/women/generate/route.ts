import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { WOMEN_PRESETS, type WomenPreset } from "@/lib/women-presets";

export const runtime = "nodejs";

const WOMEN_PRESET_IDS = new Set(WOMEN_PRESETS.map((p) => p.id));

function getPresetById(styleId: string): WomenPreset | null {
  return WOMEN_PRESETS.find((p) => p.id === styleId) ?? null;
}

function buildWomenGenerationPrompt(preset: WomenPreset): string {
  const hairPrompt = preset.aiPrompt.trim();
  return (
    "High-end salon hair edit. Keep the same person, same face, same identity, same skin tone, same lighting, same background. " +
    "Apply only the following hair style change. Do not change makeup, clothing, or background. " +
    "Result must be photorealistic, premium salon quality, no over-stylization, no unrealistic beauty edits. " +
    `Hair style to apply: ${hairPrompt}`
  );
}

function extractOutputUrl(output: unknown): string | undefined {
  if (!output) return undefined;
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) {
    return extractOutputUrl(output[0]);
  }
  if (typeof output === "object") {
    const o = output as { url?: unknown; href?: unknown; toString?: () => unknown };
    if (typeof (o as { url?: () => string }).url === "function") {
      try {
        const v = (o as { url: () => unknown }).url();
        if (typeof v === "string" && v.startsWith("http")) return v;
      } catch {
        // ignore
      }
    }
    if (typeof o.href === "string" && o.href.startsWith("http")) return o.href;
    if (typeof o.url === "string" && o.url.startsWith("http")) return o.url;
    if (typeof o.toString === "function") {
      try {
        const v = o.toString();
        if (typeof v === "string" && v.startsWith("http")) return v;
      } catch {
        // ignore
      }
    }
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN is not configured" },
      { status: 500 }
    );
  }

  let body: { imageUrl?: string; styleId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { imageUrl, styleId } = body;
  if (!imageUrl || typeof imageUrl !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid imageUrl" },
      { status: 400 }
    );
  }
  if (!styleId || typeof styleId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid styleId" },
      { status: 400 }
    );
  }

  if (
    !imageUrl.startsWith("http://") &&
    !imageUrl.startsWith("https://") &&
    !imageUrl.startsWith("data:")
  ) {
    return NextResponse.json(
      { error: "imageUrl must be an HTTP, HTTPS, or data URL" },
      { status: 400 }
    );
  }

  const preset = getPresetById(styleId);
  if (!preset || !WOMEN_PRESET_IDS.has(styleId)) {
    return NextResponse.json(
      { error: "Invalid or unknown styleId" },
      { status: 400 }
    );
  }

  const prompt = buildWomenGenerationPrompt(preset);
  const replicate = new Replicate({ auth: token });

  try {
    const output = (await replicate.run("google/nano-banana-2", {
      input: {
        prompt,
        image_input: [imageUrl],
        aspect_ratio: "match_input_image",
        resolution: "1K",
        output_format: "jpg",
      },
    })) as unknown;

    const outputUrl = extractOutputUrl(output);
    if (!outputUrl) {
      return NextResponse.json(
        { error: "No image URL returned from generation" },
        { status: 502 }
      );
    }

    return NextResponse.json({ imageUrl: outputUrl });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Generation request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

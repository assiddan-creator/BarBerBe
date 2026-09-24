import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { v2 as cloudinary } from "cloudinary";
import { BEARD_PRESETS, HAIRSTYLE_PRESETS } from "@/lib/barber-presets";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function persistResultImage(sourceUrl: string): Promise<{
  imageUrl: string;
  publicId?: string;
}> {
  const configured =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (!configured) return { imageUrl: sourceUrl };

  try {
    const result = await cloudinary.uploader.upload(sourceUrl, {
      resource_type: "image",
      folder: "barber_results",
      overwrite: false,
      unique_filename: true,
    });
    return {
      imageUrl: result.secure_url || sourceUrl,
      publicId: result.public_id,
    };
  } catch {
    return { imageUrl: sourceUrl };
  }
}

type BarberType = "hairstyle" | "beard" | "combo";

const GENERATION_MODEL = "google/nano-banana-2";
const HAIR_BY_ID = new Map(HAIRSTYLE_PRESETS.map((preset) => [preset.id, preset]));
const BEARD_BY_ID = new Map(BEARD_PRESETS.map((preset) => [preset.id, preset]));

function extractOutputUrl(output: unknown): string | undefined {
  if (!output) return undefined;

  // Direct string
  if (typeof output === "string") return output;

  // Array of outputs – inspect first item recursively
  if (Array.isArray(output) && output.length > 0) {
    return extractOutputUrl(output[0]);
  }

  // Object with possible url() method, href/url property or toString()
  if (typeof output === "object") {
    const anyOut = output as {
      url?: unknown;
      href?: unknown;
      toString?: () => unknown;
    };

    // 1) url() method (callable)
    const maybeUrlMethod = (anyOut as { url?: unknown }).url;
    if (typeof maybeUrlMethod === "function") {
      try {
        const value = (maybeUrlMethod as () => unknown)();
        if (typeof value === "string" && value.startsWith("http")) {
          return value;
        }
      } catch {
        // ignore method errors
      }
    }

    // 2) href string property
    if (typeof anyOut.href === "string" && anyOut.href.startsWith("http")) {
      return anyOut.href;
    }

    // 3) url string property
    if (typeof anyOut.url === "string" && anyOut.url.startsWith("http")) {
      return anyOut.url;
    }

    // 4) toString() returning an http URL
    if (typeof anyOut.toString === "function") {
      try {
        const value = anyOut.toString();
        if (typeof value === "string" && value.startsWith("http")) {
          return value;
        }
      } catch {
        // ignore toString errors
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
      { status: 500 },
    );
  }

  let body: {
    imageUrl?: string;
    hairId?: string;
    beardId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const imageUrl = body.imageUrl?.trim();
  const hairId = body.hairId?.trim();
  const beardId = body.beardId?.trim();

  if (!imageUrl || !imageUrl.startsWith("https://")) {
    return NextResponse.json(
      { error: "Invalid source image" },
      { status: 400 },
    );
  }

  const hairPreset = hairId ? HAIR_BY_ID.get(hairId) : undefined;
  const beardPreset = beardId ? BEARD_BY_ID.get(beardId) : undefined;

  if (hairId && !hairPreset) {
    return NextResponse.json(
      { error: "Unknown hairstyle" },
      { status: 400 },
    );
  }

  if (beardId && !beardPreset) {
    return NextResponse.json(
      { error: "Unknown beard style" },
      { status: 400 },
    );
  }

  if (!hairPreset && !beardPreset) {
    return NextResponse.json(
      { error: "Choose at least one known style" },
      { status: 400 },
    );
  }

  const type: BarberType =
    hairPreset && beardPreset
      ? "combo"
      : hairPreset
        ? "hairstyle"
        : "beard";

  const replicate = new Replicate({
    auth: token,
  });

  const BASE_PROTECTION =
    "Photorealistic salon-quality edit. Keep the same person's facial features, identity, expression, skin texture, head shape, pose, camera angle, framing, lighting direction, clothing, and background exactly the same. Preserve natural skin detail and realistic hairline geometry. Only the requested hair and/or beard area changes.";

  let stylePrompt = "";
  if (hairPreset && beardPreset) {
    stylePrompt =
      `Apply this hairstyle: ${hairPreset.aiPrompt}. Apply this beard style: ${beardPreset.aiPrompt}. The final result is one natural, photorealistic salon portrait with both changes integrated realistically.`;
  } else if (hairPreset) {
    stylePrompt = hairPreset.aiPrompt;
  } else if (beardPreset) {
    stylePrompt = beardPreset.aiPrompt;
  }

  let finalPrompt = "";
  if (type === "hairstyle") {
    finalPrompt = `Edit only the hairstyle to match: ${stylePrompt}. Keep the existing beard and facial hair exactly the same. ${BASE_PROTECTION}`;
  } else if (type === "beard") {
    finalPrompt = `Edit only the beard and facial hair to match: ${stylePrompt}. Keep the existing hairstyle exactly the same. ${BASE_PROTECTION}`;
  } else {
    finalPrompt = `Edit the hairstyle and beard together to match: ${stylePrompt}. ${BASE_PROTECTION}`;
  }

  try {
    const input = {
      prompt: finalPrompt,
      image_input: [imageUrl],
      aspect_ratio: "match_input_image",
      resolution: "1K",
      google_search: false,
      image_search: false,
      output_format: "jpg",
    };

    const output = (await replicate.run(model, {
      input,
    })) as unknown;

    // Minimal diagnostic logging to help confirm output shape during dev
    if (typeof output === "object" && output !== null) {
      const ownProps = Object.getOwnPropertyNames(output);
      // eslint-disable-next-line no-console
      console.log(
        "[barber/generate] Replicate output props:",
        ownProps,
      );
      // eslint-disable-next-line no-console
      console.log(
        "[barber/generate] has url:",
        Object.prototype.hasOwnProperty.call(output, "url"),
        "has href:",
        Object.prototype.hasOwnProperty.call(output, "href"),
        "has toString:",
        typeof (output as { toString?: unknown }).toString === "function",
      );
    } else {
      // eslint-disable-next-line no-console
      console.log(
        "[barber/generate] Replicate output type:",
        typeof output,
        Array.isArray(output) ? "(array)" : "",
      );
    }

    const outputUrl = extractOutputUrl(output);

    if (!outputUrl) {
      return NextResponse.json(
        { error: "No image URL returned from Replicate" },
        { status: 502 },
      );
    }

    const persisted = await persistResultImage(outputUrl);
    return NextResponse.json(persisted);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[barber/generate] generation failed", err);
    }
    return NextResponse.json(
      { error: "Image generation failed" },
      { status: 502 },
    );
  }
}


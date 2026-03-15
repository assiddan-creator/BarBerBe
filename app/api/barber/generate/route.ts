import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const runtime = "nodejs";

type BarberType = "hairstyle" | "beard" | "combo";

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
    prompt?: string;
    type?: BarberType;
    model?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { imageUrl, prompt, type, model: modelOverride } = body;
  if (!imageUrl || !prompt || !type) {
    return NextResponse.json(
      { error: "Missing imageUrl, prompt, or type" },
      { status: 400 },
    );
  }

  const model = modelOverride ?? "google/nano-banana-pro";
  const isFluxKontextPro =
    model === "black-forest-labs/flux-kontext-pro" ||
    model.startsWith("black-forest-labs/flux-kontext-pro:");

  const replicate = new Replicate({
    auth: token,
  });

  const BASE_PROTECTION =
    "Ultra-realistic 8K portrait photo edit. STRICT IDENTITY LOCK: Keep the exact same face shape, eyes, nose, lips, jawline, and skin texture. No smoothing, no makeup. Preserve the original lighting and background perfectly.";

  let finalPrompt = "";

  if (type === "hairstyle") {
    finalPrompt = `Modify ONLY the person's hair to be: ${prompt}. Do not touch, change, add, or remove the beard or facial hair. ${BASE_PROTECTION}`;
  } else if (type === "beard") {
    finalPrompt = `Modify ONLY the person's beard and facial hair to be: ${prompt}. Do not touch or change the hairstyle. ${BASE_PROTECTION}`;
  } else if (type === "combo") {
    finalPrompt = `Modify BOTH the person's hair and beard to be: ${prompt}. ${BASE_PROTECTION}`;
  } else {
    finalPrompt = `${prompt}. ${BASE_PROTECTION}`;
  }

  if (isFluxKontextPro) {
    finalPrompt = `Keep this exact person's face, identity, and all facial features unchanged. ${finalPrompt}`;
  }

  try {
    const input = isFluxKontextPro
      ? {
          prompt: finalPrompt,
          input_image: imageUrl,
          aspect_ratio: "match_input_image",
        }
      : {
          prompt: finalPrompt,
          image_input: [imageUrl],
          aspect_ratio: "match_input_image",
          resolution: "1K",
          output_format: "jpg",
        };

    const output = (await replicate.run(model as `${string}/${string}`, {
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

    return NextResponse.json({ imageUrl: outputUrl });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Unexpected error while calling Replicate";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}


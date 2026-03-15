import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error(
          "[barber/selfie-upload] Missing Cloudinary env vars",
          { cloudName: !!cloudName, apiKey: !!apiKey, apiSecret: !!apiSecret }
        );
      }
      return NextResponse.json(
        { error: "Image upload is not configured on this environment." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    // In the Node.js runtime, avoid relying on the global File constructor.
    if (!file || typeof (file as any).arrayBuffer !== "function") {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("[barber/selfie-upload] Missing or invalid file field");
      }
      return NextResponse.json(
        { error: "Missing image file" },
        { status: 400 }
      );
    }

    const fileLike = file as Blob & { type?: string; size?: number };

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[barber/selfie-upload] Received file", {
        type: fileLike.type,
        size: fileLike.size,
      });
    }

    if (!fileLike.type || !fileLike.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are supported" },
        { status: 400 }
      );
    }

    const arrayBuffer = await fileLike.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<{
      secure_url?: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: "barber_selfies",
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            if (process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.error(
                "[barber/selfie-upload] Cloudinary upload error",
                error
              );
            }
            return reject(error);
          }
          resolve(result ?? {});
        }
      );

      stream.end(buffer);
    });

    if (!uploadResult.secure_url) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error(
          "[barber/selfie-upload] Upload succeeded without secure_url",
          uploadResult
        );
      }
      return NextResponse.json(
        { error: "Upload did not return a URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[barber/selfie-upload] Unexpected error", message);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



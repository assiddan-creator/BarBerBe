import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const replicateConfigured = Boolean(process.env.REPLICATE_API_TOKEN);
  const cloudinaryConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

  const ok = replicateConfigured && cloudinaryConfigured;

  return NextResponse.json(
    {
      ok,
      services: {
        replicate: replicateConfigured ? "configured" : "missing",
        cloudinary: cloudinaryConfigured ? "configured" : "missing",
      },
      generationModel: "google/nano-banana-2",
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

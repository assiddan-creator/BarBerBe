import { NextRequest, NextResponse } from "next/server";
import {
  barberTvSyncConfigured,
  hashBarberTvControllerToken,
  readBarberTvSession,
  writeBarberTvSession,
} from "@/lib/barber-tv-store.server";

export const runtime = "nodejs";

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  if (!barberTvSyncConfigured()) {
    return noStoreJson({ error: "TV_SYNC_NOT_CONFIGURED" }, 503);
  }

  let body: { code?: string; controllerToken?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return noStoreJson({ error: "INVALID_JSON" }, 400);
  }

  const code = body.code?.trim();
  const controllerToken = body.controllerToken?.trim();

  if (!code || !/^\d{6}$/.test(code) || !controllerToken) {
    return noStoreJson({ error: "INVALID_TV_RESET" }, 400);
  }

  try {
    const stored = await readBarberTvSession(code);

    if (!stored) {
      return noStoreJson({ error: "TV_SESSION_NOT_FOUND" }, 404);
    }

    const { session, etag } = stored;
    const suppliedHash = hashBarberTvControllerToken(controllerToken);

    if (
      !session.controllerTokenHash ||
      suppliedHash !== session.controllerTokenHash
    ) {
      return noStoreJson({ error: "TV_CONTROLLER_DENIED" }, 403);
    }

    await writeBarberTvSession(
      {
        ...session,
        paired: false,
        controllerTokenHash: undefined,
        expiresAt: new Date(0).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { ifMatch: etag, allowOverwrite: true },
    );

    return noStoreJson({ ok: true });
  } catch {
    return noStoreJson({ error: "TV_RESET_FAILED" }, 502);
  }
}

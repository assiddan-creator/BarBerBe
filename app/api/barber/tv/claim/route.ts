import { NextRequest, NextResponse } from "next/server";
import {
  barberTvSyncConfigured,
  createBarberTvControllerToken,
  hashBarberTvControllerToken,
  readBarberTvSession,
  writeBarberTvSession,
} from "@/lib/barber-tv-store.server";

export const runtime = "nodejs";

const PAIRED_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

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

  let body: { code?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return noStoreJson({ error: "INVALID_JSON" }, 400);
  }

  const code = body.code?.trim();
  if (!code || !/^\d{6}$/.test(code)) {
    return noStoreJson({ error: "INVALID_TV_CODE" }, 400);
  }

  try {
    const stored = await readBarberTvSession(code);
    if (!stored) {
      return noStoreJson({ error: "TV_SESSION_NOT_FOUND" }, 404);
    }

    const { session, etag } = stored;

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      return noStoreJson({ error: "TV_SESSION_EXPIRED" }, 410);
    }

    if (session.paired) {
      return noStoreJson({ error: "TV_ALREADY_PAIRED" }, 409);
    }

    const controllerToken = createBarberTvControllerToken();

    const pairedExpiresAt = new Date(
      Date.now() + PAIRED_SESSION_TTL_MS,
    ).toISOString();

    await writeBarberTvSession(
      {
        ...session,
        paired: true,
        controllerTokenHash: hashBarberTvControllerToken(controllerToken),
        expiresAt: pairedExpiresAt,
        updatedAt: new Date().toISOString(),
      },
      { ifMatch: etag, allowOverwrite: true },
    );

    return noStoreJson({
      code: session.code,
      controllerToken,
      expiresAt: pairedExpiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("412") || message.includes("precondition")) {
      return noStoreJson({ error: "TV_ALREADY_PAIRED" }, 409);
    }
    return noStoreJson({ error: "TV_PAIR_FAILED" }, 502);
  }
}

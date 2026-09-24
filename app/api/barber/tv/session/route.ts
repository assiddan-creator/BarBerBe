import { NextRequest, NextResponse } from "next/server";
import {
  barberTvSyncConfigured,
  createBarberTvPairingCode,
  createBarberTvSessionRecord,
  readBarberTvSession,
  writeBarberTvSession,
} from "@/lib/barber-tv-store.server";
import {
  DEFAULT_SALON_TV_PAYLOAD,
  type SalonTvPayload,
} from "@/lib/barber-tv";

export const runtime = "nodejs";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST() {
  if (!barberTvSyncConfigured()) {
    return noStoreJson({ error: "TV_SYNC_NOT_CONFIGURED" }, 503);
  }

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = createBarberTvPairingCode();

    try {
      const existing = await readBarberTvSession(code);

      if (
        existing &&
        new Date(existing.session.expiresAt).getTime() > Date.now()
      ) {
        continue;
      }

      const record = createBarberTvSessionRecord(
        code,
        DEFAULT_SALON_TV_PAYLOAD,
        expiresAt,
      );

      await writeBarberTvSession(record, {
        ifMatch: existing?.etag,
        allowOverwrite: Boolean(existing),
      });

      return noStoreJson({
        code,
        paired: false,
        expiresAt,
        payload: DEFAULT_SALON_TV_PAYLOAD,
      });
    } catch {
      // A rare code collision or transient Blob write can be retried with a new code.
    }
  }

  return noStoreJson({ error: "TV_PAIRING_CODE_UNAVAILABLE" }, 503);
}

export async function GET(request: NextRequest) {
  if (!barberTvSyncConfigured()) {
    return noStoreJson({ error: "TV_SYNC_NOT_CONFIGURED" }, 503);
  }

  const code = request.nextUrl.searchParams.get("code")?.trim();
  if (!code || !/^\d{6}$/.test(code)) {
    return noStoreJson({ error: "INVALID_TV_CODE" }, 400);
  }

  try {
    const stored = await readBarberTvSession(code);

    if (!stored) {
      return noStoreJson({ error: "TV_SESSION_NOT_FOUND" }, 404);
    }

    const { session } = stored;

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      return noStoreJson({ error: "TV_SESSION_EXPIRED" }, 410);
    }

    return noStoreJson({
      code: session.code,
      paired: session.paired,
      expiresAt: session.expiresAt,
      payload:
        (session.payload as SalonTvPayload | null) ?? DEFAULT_SALON_TV_PAYLOAD,
    });
  } catch {
    return noStoreJson({ error: "TV_SESSION_READ_FAILED" }, 502);
  }
}

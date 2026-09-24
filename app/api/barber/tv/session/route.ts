import { NextRequest, NextResponse } from "next/server";
import {
  createBarberTvPairingCode,
  getBarberTvSupabase,
} from "@/lib/barber-tv-store.server";
import {
  DEFAULT_SALON_TV_PAYLOAD,
  type SalonTvPayload,
} from "@/lib/barber-tv";

export const runtime = "nodejs";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST() {
  const supabase = getBarberTvSupabase();
  if (!supabase) {
    return noStoreJson(
      { error: "TV_SYNC_NOT_CONFIGURED" },
      503,
    );
  }

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = createBarberTvPairingCode();
    const { error } = await supabase.from("barberbe_tv_sessions").insert({
      code,
      paired: false,
      payload: DEFAULT_SALON_TV_PAYLOAD,
      expires_at: expiresAt,
    });

    if (!error) {
      return noStoreJson({
        code,
        paired: false,
        expiresAt,
        payload: DEFAULT_SALON_TV_PAYLOAD,
      });
    }

    if (error.code !== "23505") {
      return noStoreJson({ error: "TV_SESSION_CREATE_FAILED" }, 502);
    }
  }

  return noStoreJson({ error: "TV_PAIRING_CODE_UNAVAILABLE" }, 503);
}

export async function GET(request: NextRequest) {
  const supabase = getBarberTvSupabase();
  if (!supabase) {
    return noStoreJson(
      { error: "TV_SYNC_NOT_CONFIGURED" },
      503,
    );
  }

  const code = request.nextUrl.searchParams.get("code")?.trim();
  if (!code || !/^\d{6}$/.test(code)) {
    return noStoreJson({ error: "INVALID_TV_CODE" }, 400);
  }

  const { data, error } = await supabase
    .from("barberbe_tv_sessions")
    .select("code, paired, payload, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    return noStoreJson({ error: "TV_SESSION_READ_FAILED" }, 502);
  }

  if (!data) {
    return noStoreJson({ error: "TV_SESSION_NOT_FOUND" }, 404);
  }

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    void supabase.from("barberbe_tv_sessions").delete().eq("code", code);
    return noStoreJson({ error: "TV_SESSION_EXPIRED" }, 410);
  }

  return noStoreJson({
    code: data.code,
    paired: Boolean(data.paired),
    expiresAt: data.expires_at,
    payload:
      (data.payload as SalonTvPayload | null) ?? DEFAULT_SALON_TV_PAYLOAD,
  });
}

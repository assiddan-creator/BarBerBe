import { NextRequest, NextResponse } from "next/server";
import {
  createBarberTvControllerToken,
  getBarberTvSupabase,
  hashBarberTvControllerToken,
} from "@/lib/barber-tv-store.server";

export const runtime = "nodejs";

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const supabase = getBarberTvSupabase();
  if (!supabase) {
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

  const { data: existing, error: readError } = await supabase
    .from("barberbe_tv_sessions")
    .select("code, paired, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (readError) {
    return noStoreJson({ error: "TV_SESSION_READ_FAILED" }, 502);
  }

  if (!existing) {
    return noStoreJson({ error: "TV_SESSION_NOT_FOUND" }, 404);
  }

  if (new Date(existing.expires_at).getTime() <= Date.now()) {
    return noStoreJson({ error: "TV_SESSION_EXPIRED" }, 410);
  }

  if (existing.paired) {
    return noStoreJson({ error: "TV_ALREADY_PAIRED" }, 409);
  }

  const controllerToken = createBarberTvControllerToken();
  const controllerTokenHash =
    hashBarberTvControllerToken(controllerToken);

  const { data, error } = await supabase
    .from("barberbe_tv_sessions")
    .update({
      paired: true,
      controller_token_hash: controllerTokenHash,
      updated_at: new Date().toISOString(),
    })
    .eq("code", code)
    .eq("paired", false)
    .select("code, expires_at")
    .maybeSingle();

  if (error) {
    return noStoreJson({ error: "TV_PAIR_FAILED" }, 502);
  }

  if (!data) {
    return noStoreJson({ error: "TV_ALREADY_PAIRED" }, 409);
  }

  return noStoreJson({
    code: data.code,
    controllerToken,
    expiresAt: data.expires_at,
  });
}

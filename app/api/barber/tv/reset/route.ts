import { NextRequest, NextResponse } from "next/server";
import {
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

  const { data, error } = await supabase
    .from("barberbe_tv_sessions")
    .select("controller_token_hash")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    return noStoreJson({ error: "TV_SESSION_READ_FAILED" }, 502);
  }

  if (!data) {
    return noStoreJson({ error: "TV_SESSION_NOT_FOUND" }, 404);
  }

  const suppliedHash = hashBarberTvControllerToken(controllerToken);
  if (
    !data.controller_token_hash ||
    suppliedHash !== data.controller_token_hash
  ) {
    return noStoreJson({ error: "TV_CONTROLLER_DENIED" }, 403);
  }

  const { error: deleteError } = await supabase
    .from("barberbe_tv_sessions")
    .delete()
    .eq("code", code);

  if (deleteError) {
    return noStoreJson({ error: "TV_RESET_FAILED" }, 502);
  }

  return noStoreJson({ ok: true });
}

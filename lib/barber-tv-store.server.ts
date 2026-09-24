import { createHash, randomBytes } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null | undefined;

export function getBarberTvSupabase(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;

  const url =
    process.env.BARBERBE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.BARBERBE_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    cachedClient = null;
    return null;
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

export function hashBarberTvControllerToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createBarberTvControllerToken(): string {
  return randomBytes(32).toString("base64url");
}

export function createBarberTvPairingCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function barberTvSyncConfigured(): boolean {
  return Boolean(getBarberTvSupabase());
}

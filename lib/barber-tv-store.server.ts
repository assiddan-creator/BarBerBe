import { createHash, randomBytes } from "crypto";
import type { SalonTvPayload } from "@/lib/barber-tv";

const BLOB_API_URL = "https://vercel.com/api/blob";
const BLOB_API_VERSION = "12";
const SESSION_PREFIX = "barberbe-tv/sessions";

export interface BarberTvStoredSession {
  code: string;
  paired: boolean;
  controllerTokenHash?: string;
  payload: SalonTvPayload;
  expiresAt: string;
  updatedAt: string;
}

export interface BarberTvStoredSessionRead {
  session: BarberTvStoredSession;
  etag?: string;
}

interface BlobCredentials {
  token: string;
  storeId: string;
}

function getBlobCredentials(): BlobCredentials | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return null;

  const [, , , storeId = ""] = token.split("_");
  if (!storeId) return null;

  return { token, storeId };
}

function sessionPath(code: string): string {
  return `${SESSION_PREFIX}/${code}.json`;
}

function privateBlobUrl(storeId: string, pathname: string): string {
  return `https://${storeId}.private.blob.vercel-storage.com/${pathname}`;
}

export async function readBarberTvSession(
  code: string,
): Promise<BarberTvStoredSessionRead | null> {
  const credentials = getBlobCredentials();
  if (!credentials) {
    throw new Error("TV_SYNC_NOT_CONFIGURED");
  }

  const pathname = sessionPath(code);
  const url = new URL(privateBlobUrl(credentials.storeId, pathname));
  url.searchParams.set("cache", "0");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      authorization: `Bearer ${credentials.token}`,
    },
    cache: "no-store",
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(`TV_SESSION_READ_FAILED:${response.status}`);
  }

  const session = (await response.json()) as BarberTvStoredSession;
  if (
    !session ||
    typeof session !== "object" ||
    session.code !== code ||
    typeof session.paired !== "boolean" ||
    typeof session.expiresAt !== "string" ||
    !session.payload
  ) {
    throw new Error("TV_SESSION_INVALID");
  }

  return {
    session,
    etag: response.headers.get("etag") ?? undefined,
  };
}

export async function writeBarberTvSession(
  session: BarberTvStoredSession,
  options: {
    ifMatch?: string;
    allowOverwrite?: boolean;
  } = {},
): Promise<void> {
  const credentials = getBlobCredentials();
  if (!credentials) {
    throw new Error("TV_SYNC_NOT_CONFIGURED");
  }

  const pathname = sessionPath(session.code);
  const params = new URLSearchParams({ pathname });

  const headers: Record<string, string> = {
    authorization: `Bearer ${credentials.token}`,
    "content-type": "application/json",
    "x-content-type": "application/json",
    "x-vercel-blob-access": "private",
    "x-add-random-suffix": "0",
    "x-allow-overwrite": options.allowOverwrite === false ? "0" : "1",
    "x-cache-control-max-age": "60",
    "x-vercel-blob-store-id": credentials.storeId,
    "x-api-version": BLOB_API_VERSION,
    "x-api-blob-request-id": `${credentials.storeId}:${Date.now()}:${randomBytes(8).toString("hex")}`,
    "x-api-blob-request-attempt": "0",
  };

  if (options.ifMatch) {
    headers["x-if-match"] = options.ifMatch;
    headers["x-allow-overwrite"] = "1";
  }

  const response = await fetch(`${BLOB_API_URL}/?${params.toString()}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(session),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `TV_SESSION_WRITE_FAILED:${response.status}:${detail.slice(0, 180)}`,
    );
  }
}

export function createBarberTvSessionRecord(
  code: string,
  payload: SalonTvPayload,
  expiresAt: string,
): BarberTvStoredSession {
  return {
    code,
    paired: false,
    payload,
    expiresAt,
    updatedAt: new Date().toISOString(),
  };
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
  return Boolean(getBlobCredentials());
}

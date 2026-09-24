import { NextRequest, NextResponse } from "next/server";
import {
  barberTvSyncConfigured,
  hashBarberTvControllerToken,
  readBarberTvSession,
  writeBarberTvSession,
} from "@/lib/barber-tv-store.server";
import type { SalonProduct } from "@/lib/barber-salon-products";
import type { SalonTvPayload } from "@/lib/barber-tv";

export const runtime = "nodejs";

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function safeHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 1200 || !trimmed.startsWith("https://")) {
    return undefined;
  }
  return trimmed;
}

function sanitizeProduct(value: unknown): SalonProduct | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Partial<SalonProduct>;

  if (
    typeof raw.id !== "string" ||
    typeof raw.name !== "string" ||
    !raw.id.trim() ||
    !raw.name.trim()
  ) {
    return undefined;
  }

  const price =
    typeof raw.price === "number" &&
    Number.isFinite(raw.price) &&
    raw.price >= 0 &&
    raw.price <= 100000
      ? raw.price
      : undefined;

  return {
    id: raw.id.slice(0, 100),
    name: raw.name.trim().slice(0, 100),
    ...(price !== undefined ? { price } : {}),
    ...(safeHttpsUrl(raw.imageUrl) ? { imageUrl: safeHttpsUrl(raw.imageUrl) } : {}),
    ...(typeof raw.categoryId === "string" && raw.categoryId.trim()
      ? { categoryId: raw.categoryId.trim().slice(0, 100) }
      : {}),
    ...(typeof raw.note === "string" && raw.note.trim()
      ? { note: raw.note.trim().slice(0, 220) }
      : {}),
    active: raw.active !== false,
  };
}

function sanitizePayload(value: unknown): SalonTvPayload | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<SalonTvPayload>;

  if (!["idle", "client", "product"].includes(raw.mode ?? "")) {
    return null;
  }

  const featuredProducts = Array.isArray(raw.featuredProducts)
    ? raw.featuredProducts
        .map(sanitizeProduct)
        .filter((item): item is SalonProduct => Boolean(item))
        .slice(0, 6)
    : [];

  const payload: SalonTvPayload = {
    mode: raw.mode as SalonTvPayload["mode"],
    updatedAt: Date.now(),
    featuredProducts,
  };

  if (raw.mode === "client") {
    const client = raw.client;
    if (!client || typeof client !== "object") return null;

    const afterUrl = safeHttpsUrl(client.afterUrl);
    const title =
      typeof client.title === "string" ? client.title.trim().slice(0, 120) : "";

    if (!afterUrl || !title) return null;

    payload.client = {
      title,
      afterUrl,
      favorite: Boolean(client.favorite),
      ...(safeHttpsUrl(client.beforeUrl)
        ? { beforeUrl: safeHttpsUrl(client.beforeUrl) }
        : {}),
      ...(typeof client.clientName === "string" && client.clientName.trim()
        ? { clientName: client.clientName.trim().slice(0, 50) }
        : {}),
    };
  }

  if (raw.mode === "product") {
    const product = sanitizeProduct(raw.product);
    if (!product) return null;
    payload.product = product;
  }

  return payload;
}

export async function POST(request: NextRequest) {
  if (!barberTvSyncConfigured()) {
    return noStoreJson({ error: "TV_SYNC_NOT_CONFIGURED" }, 503);
  }

  let body: {
    code?: string;
    controllerToken?: string;
    payload?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return noStoreJson({ error: "INVALID_JSON" }, 400);
  }

  const code = body.code?.trim();
  const controllerToken = body.controllerToken?.trim();
  const payload = sanitizePayload(body.payload);

  if (!code || !/^\d{6}$/.test(code) || !controllerToken || !payload) {
    return noStoreJson({ error: "INVALID_TV_UPDATE" }, 400);
  }

  try {
    const stored = await readBarberTvSession(code);

    if (!stored || !stored.session.paired) {
      return noStoreJson({ error: "TV_SESSION_NOT_PAIRED" }, 404);
    }

    const { session, etag } = stored;

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      return noStoreJson({ error: "TV_SESSION_EXPIRED" }, 410);
    }

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
        payload,
        updatedAt: new Date().toISOString(),
      },
      { ifMatch: etag, allowOverwrite: true },
    );

    return noStoreJson({ ok: true, payload });
  } catch {
    return noStoreJson({ error: "TV_UPDATE_FAILED" }, 502);
  }
}

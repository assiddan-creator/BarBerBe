import { createHmac, timingSafeEqual } from "crypto";

const PERMIT_TTL_MS = 30 * 60 * 1000;

function getSecret(): string | null {
  return (
    process.env.BARBERBE_GENERATION_SECRET ||
    process.env.REPLICATE_API_TOKEN ||
    null
  );
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createGenerationPermit(imageUrl: string): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const expiresAt = Date.now() + PERMIT_TTL_MS;
  const payload = `${expiresAt}:${imageUrl}`;
  const signature = signPayload(payload, secret);

  return `${expiresAt}.${signature}`;
}

export function verifyGenerationPermit(
  imageUrl: string,
  permit?: string | null,
): boolean {
  const secret = getSecret();
  if (!secret || !permit) return false;

  const [expiresRaw, signature] = permit.split(".");
  const expiresAt = Number(expiresRaw);

  if (
    !expiresRaw ||
    !signature ||
    !Number.isFinite(expiresAt) ||
    Date.now() > expiresAt
  ) {
    return false;
  }

  const payload = `${expiresAt}:${imageUrl}`;
  const expected = signPayload(payload, secret);

  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

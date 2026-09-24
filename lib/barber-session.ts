export const BARBER_SELFIE_STORAGE_KEY = "barber_selfie";
export const BARBER_SELFIE_PUBLIC_ID_STORAGE_KEY = "barber_selfie_public_id";
export const BARBER_GENERATION_PERMIT_STORAGE_KEY = "barber_generation_permit";
export const BARBER_STYLE_STORAGE_KEY = "barber_style";
export const BARBER_HAIRSTYLE_STORAGE_KEY = "barber_hairstyle";
export const BARBER_BEARD_STORAGE_KEY = "barber_beard";
export const BARBER_COMBO_STORAGE_KEY = "barber_combo";
export const BARBER_FLOW_STORAGE_KEY = "barber_flow";
export const BARBER_USER_MODE_STORAGE_KEY = "barber_user_mode";
export const BARBER_WOMEN_STYLE_STORAGE_KEY = "barber_women_style";
export const BARBER_WOMEN_GENERATED_IMAGE_STORAGE_KEY = "barber_women_generated_image";
export const BARBER_ANALYSIS_ENGINE_STORAGE_KEY = "barber_analysis_engine";
export const BARBER_ANALYSIS_STORAGE_KEY = "barber_analysis";
export const BARBER_HAIR_TYPE_STORAGE_KEY = "barber_hair_type";
export const BARBER_RESULT_HISTORY_STORAGE_KEY = "barber_result_history";
export const BARBER_CLIENT_NAME_STORAGE_KEY = "barber_client_name";
export const BARBER_FAVORITE_RESULT_ID_STORAGE_KEY = "barber_favorite_result_id";

export interface BarberResultHistoryItem {
  id: string;
  createdAt: number;
  imageUrl: string;
  publicId?: string;
  sourceImageUrl: string;
  title: string;
  flow: "men" | "women";
  hairId?: string;
  beardId?: string;
  womenStyleId?: string;
}

export function readBarberResultHistory(): BarberResultHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(BARBER_RESULT_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is BarberResultHistoryItem =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.createdAt === "number" &&
        typeof item.imageUrl === "string" &&
        typeof item.sourceImageUrl === "string" &&
        typeof item.title === "string" &&
        (item.flow === "men" || item.flow === "women"),
    );
  } catch {
    return [];
  }
}

export function appendBarberResultHistory(
  item: BarberResultHistoryItem,
  maxItems = 8,
): BarberResultHistoryItem[] {
  if (typeof window === "undefined") return [];

  const existing = readBarberResultHistory().filter((x) => x.id !== item.id);
  const combined = [item, ...existing];
  const favoriteId = sessionStorage.getItem(
    BARBER_FAVORITE_RESULT_ID_STORAGE_KEY,
  );

  let next = combined.slice(0, maxItems);

  if (
    favoriteId &&
    !next.some((historyItem) => historyItem.id === favoriteId)
  ) {
    const favoriteItem = combined.find(
      (historyItem) => historyItem.id === favoriteId,
    );

    if (favoriteItem) {
      next = [...next.slice(0, Math.max(0, maxItems - 1)), favoriteItem];
    }
  }

  try {
    sessionStorage.setItem(BARBER_RESULT_HISTORY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // History is optional. Generation should never fail because storage is full.
  }
  return next;
}

export function clearBarberWorkingSession(options?: { keepHistory?: boolean }) {
  if (typeof window === "undefined") return;

  const keys = [
    BARBER_SELFIE_STORAGE_KEY,
    BARBER_SELFIE_PUBLIC_ID_STORAGE_KEY,
    BARBER_GENERATION_PERMIT_STORAGE_KEY,
    BARBER_STYLE_STORAGE_KEY,
    BARBER_HAIRSTYLE_STORAGE_KEY,
    BARBER_BEARD_STORAGE_KEY,
    BARBER_COMBO_STORAGE_KEY,
    BARBER_FLOW_STORAGE_KEY,
    BARBER_WOMEN_STYLE_STORAGE_KEY,
    BARBER_WOMEN_GENERATED_IMAGE_STORAGE_KEY,
    BARBER_ANALYSIS_STORAGE_KEY,
    BARBER_HAIR_TYPE_STORAGE_KEY,
    BARBER_CLIENT_NAME_STORAGE_KEY,
    BARBER_FAVORITE_RESULT_ID_STORAGE_KEY,
  ];

  if (!options?.keepHistory) {
    keys.push(BARBER_RESULT_HISTORY_STORAGE_KEY);
  }

  for (const key of keys) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore storage errors
    }
  }
}

/** Default hero image shown when no selfie is uploaded. Visual placeholder only; never stored in sessionStorage. */
export const BARBER_DEFAULT_HERO_IMAGE = "/images/barber-default-scan.png";

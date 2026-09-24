export const BARBER_SALON_PRODUCTS_STORAGE_KEY = "barber_salon_products";

export interface SalonProduct {
  id: string;
  name: string;
  price?: number;
  imageUrl?: string;
  categoryId?: string;
  active: boolean;
  note?: string;
}

export function readSalonProducts(): SalonProduct[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(BARBER_SALON_PRODUCTS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is SalonProduct =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.active === "boolean",
    );
  } catch {
    return [];
  }
}

export function writeSalonProducts(products: SalonProduct[]) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      BARBER_SALON_PRODUCTS_STORAGE_KEY,
      JSON.stringify(products.slice(0, 60)),
    );
  } catch {
    // Product inventory is optional local salon configuration.
  }
}

export function createSalonProductId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `product-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function matchSalonProductsToCategories(
  products: SalonProduct[],
  categoryIds: string[],
  maxItems = 3,
): SalonProduct[] {
  const wanted = new Set(categoryIds);
  const active = products.filter((product) => product.active);

  const matched = active.filter(
    (product) => product.categoryId && wanted.has(product.categoryId),
  );

  if (matched.length >= maxItems) return matched.slice(0, maxItems);

  const fallback = active.filter(
    (product) => !matched.some((item) => item.id === product.id),
  );

  return [...matched, ...fallback].slice(0, maxItems);
}

export type HairType =
  | "short-textured"
  | "medium-classic"
  | "curly"
  | "slick"
  | "buzz"
  | "casual-messy";

export type BeardType =
  | "clean"
  | "stubble-light"
  | "stubble-heavy"
  | "short-boxed"
  | "full"
  | "corporate";

export type FinishType = "matte" | "natural" | "shine";

export type HoldLevel = "light" | "medium" | "strong";

// Align with original schema: only low | medium | high
export type MaintenanceLevel = "low" | "medium" | "high";

// Align with original schema: casual | beachy | urban | business | classic | bold
export type Vibe =
  | "casual"
  | "beachy"
  | "urban"
  | "business"
  | "classic"
  | "bold";

// Align with original schema: numeric upsell priority 0–3
export type UpsellPriority = 0 | 1 | 2 | 3;

export type ProductCategory = {
  id: string;
  nameHe: string;
  role: UpsellPriority;
  category: "hair" | "beard";
  hairTypes?: HairType[];
  beardTypes?: BeardType[];
  finishes?: FinishType[];
  holdLevels?: HoldLevel[];
  maintenanceLevel?: MaintenanceLevel;
  vibes?: Vibe[];
  routineRole?: string;
  marketFitScore?: number;
  beginnerFriendly?: boolean;
  usageHe: string;
};

export type ProductRecommendation = ProductCategory;

// --- Base product categories (small, curated set) ---

export const hairCategories: ProductCategory[] = [
  {
    id: "matte-paste",
    nameHe: "משחת מאט",
    role: 0,
    category: "hair",
    hairTypes: ["short-textured", "casual-messy", "medium-classic"],
    finishes: ["matte"],
    holdLevels: ["medium"],
    maintenanceLevel: "low",
    vibes: ["casual", "urban"],
    routineRole: "style",
    marketFitScore: 0.9,
    beginnerFriendly: true,
    usageHe: "כמות קטנה על שיער יבש, לעבוד מהשורש לקצוות לעיצוב יומיומי.",
  },
  {
    id: "hair-clay",
    nameHe: "קלי לשיער מט",
    role: 0,
    category: "hair",
    hairTypes: ["short-textured", "casual-messy"],
    finishes: ["matte"],
    holdLevels: ["strong"],
    maintenanceLevel: "medium",
    vibes: ["urban", "bold"],
    routineRole: "style",
    marketFitScore: 0.85,
    beginnerFriendly: false,
    usageHe: "לחמם מעט בידיים ולפזר בשיער קצר-בינוני לעיצוב חד ומדויק.",
  },
  {
    id: "texture-powder",
    nameHe: "פודרת טקסטורה",
    role: 1,
    category: "hair",
    hairTypes: ["short-textured", "casual-messy"],
    finishes: ["matte"],
    holdLevels: ["light"],
    maintenanceLevel: "low",
    vibes: ["casual", "beachy"],
    routineRole: "finish",
    marketFitScore: 0.8,
    beginnerFriendly: true,
    usageHe: "לפזר מעט על השורש ולהרים עם האצבעות לנפח קליל.",
  },
  {
    id: "styling-cream",
    nameHe: "קרם סטיילינג",
    role: 0,
    category: "hair",
    hairTypes: ["medium-classic", "slick", "curly"],
    finishes: ["natural"],
    holdLevels: ["light", "medium"],
    maintenanceLevel: "low",
    vibes: ["business", "classic"],
    routineRole: "style",
    marketFitScore: 0.9,
    beginnerFriendly: true,
    usageHe: "למרוח כמות קטנה על שיער לח או יבש לסידור רך ונקי.",
  },
  {
    id: "pomade",
    nameHe: "פומייד קלאסי",
    role: 1,
    category: "hair",
    hairTypes: ["slick", "medium-classic"],
    finishes: ["shine"],
    holdLevels: ["medium", "strong"],
    maintenanceLevel: "medium",
    vibes: ["classic", "bold"],
    routineRole: "style",
    marketFitScore: 0.75,
    beginnerFriendly: false,
    usageHe: "למרוח שכבה דקה ולסרק לאחור או לצד ללוק נקי ומבריק.",
  },
  {
    id: "curl-cream",
    nameHe: "קרם תלתלים קל",
    role: 0,
    category: "hair",
    hairTypes: ["curly"],
    finishes: ["natural"],
    holdLevels: ["light"],
    maintenanceLevel: "medium",
    vibes: ["casual"],
    routineRole: "style",
    marketFitScore: 0.88,
    beginnerFriendly: true,
    usageHe: "למרוח על שיער לח ולהדגיש תלתלים בלי להקשיח אותם.",
  },
  {
    id: "sea-salt-spray",
    nameHe: "ספריי מי מלח",
    role: 1,
    category: "hair",
    hairTypes: ["casual-messy", "medium-classic"],
    finishes: ["matte", "natural"],
    holdLevels: ["light"],
    maintenanceLevel: "low",
    vibes: ["beachy", "casual"],
    routineRole: "prep",
    marketFitScore: 0.8,
    beginnerFriendly: true,
    usageHe: "לרסס על שיער לח ולפרק עם האצבעות לטקסטורה טבעית.",
  },
];

export const beardCategories: ProductCategory[] = [
  {
    id: "beard-oil",
    nameHe: "שמן זקן יומיומי",
    role: 0,
    category: "beard",
    beardTypes: ["stubble-heavy", "short-boxed", "full", "corporate"],
    maintenanceLevel: "medium",
    vibes: ["classic", "business"],
    routineRole: "treat",
    marketFitScore: 0.95,
    beginnerFriendly: true,
    usageHe: "2–4 טיפות על זקן יבש/לח, לעסות עד העור לריכוך ועדינות.",
  },
  {
    id: "beard-balm",
    nameHe: "באלם זקן",
    role: 1,
    category: "beard",
    beardTypes: ["short-boxed", "full", "corporate"],
    maintenanceLevel: "medium",
    vibes: ["business", "classic"],
    routineRole: "style",
    marketFitScore: 0.8,
    beginnerFriendly: true,
    usageHe: "למרוח שכבה דקה לכיוון הצמיחה לסידור קווי הזקן.",
  },
  {
    id: "beard-shampoo",
    nameHe: "שמפו זקן",
    role: 1,
    category: "beard",
    beardTypes: ["full", "corporate"],
    maintenanceLevel: "medium",
    vibes: ["classic"],
    routineRole: "cleanse",
    marketFitScore: 0.78,
    beginnerFriendly: true,
    usageHe: "לשטוף את הזקן 2–3 פעמים בשבוע לניקוי עדין ללא ייבוש.",
  },
  {
    id: "precision-trimmer",
    nameHe: "מכונת קנטים/טרימר מדויק",
    role: 2,
    category: "beard",
    beardTypes: ["stubble-light", "stubble-heavy", "short-boxed", "corporate"],
    maintenanceLevel: "high",
    vibes: ["business", "bold"],
    routineRole: "tool",
    marketFitScore: 0.7,
    beginnerFriendly: false,
    usageHe: "שימוש פעם–פעמיים בשבוע לסימון קווי קונטור וניקוי קווי הצוואר.",
  },
];

export const ALL_PRODUCT_CATEGORIES: ProductCategory[] = [
  ...hairCategories,
  ...beardCategories,
];

export interface ProductRecommendationView {
  id: string;
  nameHe: string;
  usageHe: string;
  role: UpsellPriority;
  category: "hair" | "beard";
}

export interface ProductRecommendationContext {
  hairstyleId?: string | null;
  beardId?: string | null;
  maintenanceLevel?: "low" | "medium" | "high" | "very-low" | null;
  hairstyleVibe?: string | null;
  beardVibe?: string | null;
  hasBeard: boolean;
  isCleanShaven: boolean;
}

// --- Simple deterministic recommendation helper ---

export function getBarberProductRecommendations(
  ctx: ProductRecommendationContext,
  maxCount = 3
): ProductRecommendationView[] {
  const results: ProductRecommendation[] = [];

  const maintenance = normalizePresetMaintenance(ctx.maintenanceLevel);
  const vibes: string[] = [
    ctx.hairstyleVibe ?? "",
    ctx.beardVibe ?? "",
  ].filter(Boolean);

  const isTexturedHair =
    ctx.hairstyleId &&
    /crop|textured|messy|fade/i.test(ctx.hairstyleId) &&
    !/slick|side-part|buzz/i.test(ctx.hairstyleId);

  const isClassicHair =
    ctx.hairstyleId &&
    /(gentleman|side-part|ivy|taper|clean-fade)/i.test(ctx.hairstyleId);

  const isCurlyHair =
    ctx.hairstyleId && /(curl|curly)/i.test(ctx.hairstyleId);

  const isCasualVibe = vibes.some((v) =>
    /street|everyday|casual|young/i.test(v)
  );

  const hasFullerBeard =
    ctx.hasBeard &&
    !ctx.isCleanShaven &&
    ctx.beardId &&
    /(full|boxed|corporate)/i.test(ctx.beardId);

  // --- Hair core product ---
  if (isTexturedHair) {
    const core =
      ALL_PRODUCT_CATEGORIES.find((p) => p.id === "matte-paste") ??
      ALL_PRODUCT_CATEGORIES.find(
        (p) => p.category === "hair" && p.role === 0
      );
    if (core) results.push(core);

    if (maintenance !== "high" && results.length < maxCount) {
      const powder = ALL_PRODUCT_CATEGORIES.find(
        (p) => p.id === "texture-powder"
      );
      if (powder) results.push(powder);
    }
  } else if (isClassicHair) {
    const cream =
      ALL_PRODUCT_CATEGORIES.find((p) => p.id === "styling-cream") ??
      ALL_PRODUCT_CATEGORIES.find(
        (p) =>
          p.category === "hair" &&
          p.role === 0 &&
          p.id !== "matte-paste"
      );
    if (cream) results.push(cream);

    if (maintenance !== "low" && results.length < maxCount) {
      const pomade = ALL_PRODUCT_CATEGORIES.find((p) => p.id === "pomade");
      if (pomade) results.push(pomade);
    }
  } else if (isCurlyHair) {
    const curl = ALL_PRODUCT_CATEGORIES.find((p) => p.id === "curl-cream");
    if (curl) results.push(curl);
  } else if (isCasualVibe) {
    const seaSalt = ALL_PRODUCT_CATEGORIES.find(
      (p) => p.id === "sea-salt-spray"
    );
    if (seaSalt) results.push(seaSalt);
  }

  // --- Beard products ---
  if (ctx.hasBeard && !ctx.isCleanShaven) {
    const oil = ALL_PRODUCT_CATEGORIES.find((p) => p.id === "beard-oil");
    if (oil) results.push(oil);

    if (hasFullerBeard && maintenance === "high" && results.length < maxCount) {
      const balm = ALL_PRODUCT_CATEGORIES.find((p) => p.id === "beard-balm");
      if (balm) results.push(balm);
    }

    if (hasFullerBeard && maintenance === "high" && results.length < maxCount) {
      const trimmer = ALL_PRODUCT_CATEGORIES.find(
        (p) => p.id === "precision-trimmer"
      );
      if (trimmer) results.push(trimmer);
    }
  }

  // Final trimming and mapping to view
  const unique: ProductRecommendation[] = [];
  for (const p of results) {
    if (!unique.find((u) => u.id === p.id) && unique.length < maxCount) {
      unique.push(p);
    }
  }

  return unique.map((p) => ({
    id: p.id,
    nameHe: p.nameHe,
    usageHe: p.usageHe,
    role: p.role,
    category: p.category,
  }));
}

// --- Helpers ---

export function normalizePresetMaintenance(
  value: "low" | "medium" | "high" | "very-low" | null | undefined
): MaintenanceLevel {
  if (value === "high") return "high";
  if (value === "medium") return "medium";
  return "low";
}



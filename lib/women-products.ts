// Data layer for WOMEN'S BarBerBe / HairAI product recommendations.
// Pure types + data, no UI or e‑commerce logic.

// --- Core enums / types ---

export type WomenProductType =
  | "heat-protectant"
  | "anti-frizz"
  | "leave-in-cream"
  | "curl-cream"
  | "curl-gel"
  | "hair-oil"
  | "hair-serum"
  | "volumizing-spray"
  | "texture-spray"
  | "sea-salt-spray"
  | "mousse"
  | "dry-shampoo"
  | "hair-mask"
  | "bond-repair"
  | "scalp-treatment"
  | "color-safe-shampoo"
  | "silver-shampoo"
  | "anti-humidity-spray";

export type WomenMaintenanceLevel = "low" | "medium" | "high";

export type WomenPriceRelevance =
  | "standard-ok" // בסדר גם ברמות מחיר נגישות
  | "better-premium" // שווה להשקיע טיפה יותר
  | "high-premium-only"; // מורגש בעיקר במוצרים יקרים / מקצועיים

export type WomenHairGoal =
  | "smoothness"
  | "frizz-control"
  | "curl-definition"
  | "volume"
  | "repair"
  | "shine"
  | "color-care"
  | "scalp-balance"
  | "hold"
  | "refresh-between-washes";

export type WomenClimateRelevance =
  | "heat"
  | "humidity"
  | "dry-air"
  | "sun-exposure"
  | "urban-pollution";

export type WomenSalonFit =
  | "home-friendly"
  | "salon-only"
  | "hybrid"; // עובד טוב גם בבית וגם בהמלצת סלון

export type WomenRecommendationRole = "core" | "optional" | "upgrade";

export type WomenHairTypeTag =
  | "straight-fine"
  | "straight-thick"
  | "wavy"
  | "curly"
  | "coily"
  | "chemically-treated"
  | "colored"
  | "highlighted"
  | "blonde"
  | "grey"
  | "oily-scalp"
  | "dry-scalp";

// --- Main category type ---

export interface WomenProductCategory {
  id: string;
  name: string;
  nameHe: string;
  type: WomenProductType;
  description: string;
  usageHe: string;
  maintenanceLevel: WomenMaintenanceLevel;
  recommendationRole: WomenRecommendationRole;
  bestForHairTypes: WomenHairTypeTag[];
  bestForGoals: WomenHairGoal[];
  climateRelevance: WomenClimateRelevance[];
  salonFit: WomenSalonFit;
  beginnerFriendly: boolean;
  marketFitScore: number; // 0–1, general suitability for Israeli market
  notes?: string;
}

// --- First Israeli-focused women’s product categories ---

export const WOMEN_PRODUCT_CATEGORIES: WomenProductCategory[] = [
  {
    id: "heat-protectant-spray",
    name: "Heat Protectant Spray",
    nameHe: "ספריי הגנה מחום",
    type: "heat-protectant",
    description:
      "ספריי קליל לפני פן/מחליק שמגן מפני חום גבוה בלי להכביד על השיער.",
    usageHe:
      "לפני פן או מחליק – לרסס על שיער לח או יבש בחלקים דקים, לסרק ולהמשיך לעיצוב.",
    maintenanceLevel: "medium",
    recommendationRole: "core",
    bestForHairTypes: [
      "straight-fine",
      "straight-thick",
      "wavy",
      "curly",
      "chemically-treated",
      "colored",
    ],
    bestForGoals: ["smoothness", "repair", "shine"],
    climateRelevance: ["heat", "sun-exposure"],
    salonFit: "hybrid",
    beginnerFriendly: true,
    marketFitScore: 0.95,
    notes: "רלוונטי כמעט לכל לקוחה שעושה פן או שימוש קבוע בחום.",
  },
  {
    id: "anti-frizz-serum",
    name: "Anti-Frizz Serum",
    nameHe: "סרום אנטי־פריז",
    type: "anti-frizz",
    description:
      "סרום קליל שמעדן קצוות ופריז, מתאים במיוחד לאקלים לח כמו בישראל.",
    usageHe:
      "1–2 לחיצות על כף היד, לעבוד על אמצע השיער וקצוות, ניתן להשתמש על שיער לח או יבש.",
    maintenanceLevel: "low",
    recommendationRole: "core",
    bestForHairTypes: ["wavy", "curly", "straight-thick", "chemically-treated"],
    bestForGoals: ["frizz-control", "smoothness", "shine"],
    climateRelevance: ["humidity", "dry-air", "sun-exposure"],
    salonFit: "hybrid",
    beginnerFriendly: true,
    marketFitScore: 0.9,
    notes: "אחד המוצרים הכי רלוונטיים ליום־יום בישראל, במיוחד בקיץ.",
  },
  {
    id: "leave-in-cream-daily",
    name: "Daily Leave-In Cream",
    nameHe: "קרם לחות לשיער (ליב־אין)",
    type: "leave-in-cream",
    description:
      "קרם לחות יומיומי שמרכך ומסייע בסירוק ללא שטיפה, בלי להרגיש כבד.",
    usageHe:
      "על שיער לח לאחר חפיפה – כמות קטנה באורך האמצעי והקצוות, לסרק ולהשאיר.",
    maintenanceLevel: "low",
    recommendationRole: "core",
    bestForHairTypes: [
      "straight-fine",
      "straight-thick",
      "wavy",
      "curly",
      "chemically-treated",
    ],
    bestForGoals: ["smoothness", "repair", "frizz-control"],
    climateRelevance: ["humidity", "dry-air", "sun-exposure"],
    salonFit: "hybrid",
    beginnerFriendly: true,
    marketFitScore: 0.92,
    notes: "מתאים לרוב הלקוחות שמתקשות בסירוק או מרגישות יובש בקצוות.",
  },
  {
    id: "curl-cream-define",
    name: "Curl Defining Cream",
    nameHe: "קרם תלתלים מגדיר",
    type: "curl-cream",
    description:
      "קרם תלתלים שמגדיר ומרכך מבלי להקשיח, לשיער גלי–מתולתל ישראלי.",
    usageHe:
      "על שיער לח – למרוח בנדיבות, לסרק עם האצבעות וללחוץ בעדינות את התלתלים.",
    maintenanceLevel: "medium",
    recommendationRole: "core",
    bestForHairTypes: ["wavy", "curly", "coily"],
    bestForGoals: ["curl-definition", "frizz-control", "smoothness"],
    climateRelevance: ["humidity", "heat"],
    salonFit: "hybrid",
    beginnerFriendly: true,
    marketFitScore: 0.9,
    notes: "בסיס כמעט חובה למי שלובשת את השיער בתלתלים פתוחים.",
  },
  {
    id: "curl-gel-hold",
    name: "Curl Gel Hold",
    nameHe: "ג'ל תלתלים קל",
    type: "curl-gel",
    description:
      "ג'ל תלתלים קליל שמוסיף החזקה מעל קרם בלי ליצור תחושת קרסטות חזקה.",
    usageHe:
      "אחרי קרם תלתלים – למרוח שכבה דקה, לתת להתייבש ואז 'לשבור' בעדינות את הגימור.",
    maintenanceLevel: "medium",
    recommendationRole: "optional",
    bestForHairTypes: ["wavy", "curly", "coily"],
    bestForGoals: ["curl-definition", "hold"],
    climateRelevance: ["humidity", "heat"],
    salonFit: "hybrid",
    beginnerFriendly: false,
    marketFitScore: 0.78,
    notes: "מתאים במיוחד למי שרוצה להחזיק תלתלים מסודרים יום שלם.",
  },
  {
    id: "hair-oil-shine",
    name: "Light Hair Oil",
    nameHe: "שמן לשיער לקצוות",
    type: "hair-oil",
    description:
      "שמן קליל לקצוות שמוסיף ברק ומפחית תחושת יובש, בלי להעמיס על השיער.",
    usageHe:
      "טיפה–שתיים בקצוות בלבד, אחרי ייבוש או על שיער יבש, לא להתקרב לשורש.",
    maintenanceLevel: "low",
    recommendationRole: "optional",
    bestForHairTypes: ["straight-thick", "wavy", "curly", "chemically-treated"],
    bestForGoals: ["shine", "repair"],
    climateRelevance: ["dry-air", "sun-exposure"],
    salonFit: "hybrid",
    beginnerFriendly: true,
    marketFitScore: 0.84,
  },
  {
    id: "volumizing-spray-root",
    name: "Root Volumizing Spray",
    nameHe: "ספריי נפח לשורש",
    type: "volumizing-spray",
    description:
      "ספריי קליל לשורשים שנותן הרמה ונפח בעיקר לשיער דק או שומני בשורש.",
    usageHe:
      "לרסס על שיער לח בשורשים, לעבוד עם מברשת ופן או לייבש עם ראש למעלה.",
    maintenanceLevel: "medium",
    recommendationRole: "optional",
    bestForHairTypes: ["straight-fine", "wavy"],
    bestForGoals: ["volume"],
    climateRelevance: ["humidity", "urban-pollution"],
    salonFit: "hybrid",
    beginnerFriendly: true,
    marketFitScore: 0.8,
  },
  {
    id: "texture-spray-soft",
    name: "Soft Texture Spray",
    nameHe: "ספריי טקסטורה רך",
    type: "texture-spray",
    description:
      "ספריי טקסטורה עדין שנותן מראה 'חובבני יפה' לשיער חלק או גלי, בלי להרגיש כבד.",
    usageHe:
      "לרסס על אורך וקצוות בשיער יבש, ולעסות עם הידיים ללוק יותר מעוצב אבל רך.",
    maintenanceLevel: "low",
    recommendationRole: "optional",
    bestForHairTypes: ["straight-fine", "straight-thick", "wavy"],
    bestForGoals: ["volume", "texture-spray" as WomenHairGoal], // placeholder goal
    climateRelevance: ["urban-pollution", "dry-air"],
    salonFit: "home-friendly",
    beginnerFriendly: true,
    marketFitScore: 0.76,
    notes: "משלים טוב לפן רך או בייביליס, בעיקר לצילומים / ערב.",
  },
  {
    id: "sea-salt-spray-beach",
    name: "Sea Salt Spray",
    nameHe: "ספריי מי מלח לגלים",
    type: "sea-salt-spray",
    description:
      "ספריי מי מלח ללוק חוף־ים רך, מתאים לשיער גלי/חלק שרוצה קצת תנועה.",
    usageHe:
      "על שיער לח או יבש – לרסס, ללחוץ בעדינות את האורך ולהשאיר לייבוש טבעי.",
    maintenanceLevel: "low",
    recommendationRole: "optional",
    bestForHairTypes: ["straight-fine", "wavy"],
    bestForGoals: ["volume", "refresh-between-washes"],
    climateRelevance: ["humidity", "sun-exposure"],
    salonFit: "home-friendly",
    beginnerFriendly: true,
    marketFitScore: 0.8,
  },
  {
    id: "dry-shampoo-refresh",
    name: "Dry Shampoo",
    nameHe: "שמפו יבש רענון שורש",
    type: "dry-shampoo",
    description:
      "שמפו יבש לספיחת שומן ורענון מהיר בין חפיפות, במיוחד בימים חמים או עמוסים.",
    usageHe:
      "על שיער יבש – לרסס לשורשים ממרחק, להמתין דקה ולספוג בעדינות עם האצבעות.",
    maintenanceLevel: "low",
    recommendationRole: "optional",
    bestForHairTypes: ["straight-fine", "straight-thick", "wavy", "oily-scalp"],
    bestForGoals: ["refresh-between-washes", "volume"],
    climateRelevance: ["heat", "humidity", "urban-pollution"],
    salonFit: "home-friendly",
    beginnerFriendly: true,
    marketFitScore: 0.88,
    notes: "מאוד רלוונטי ללוז ישראלי עמוס, כשהזמן לחפיפה קצר.",
  },
  {
    id: "hair-mask-weekly",
    name: "Weekly Hair Mask",
    nameHe: "מסכת שיער שבועית",
    type: "hair-mask",
    description:
      "מסכה מזינה לשימוש פעם–פעמיים בשבוע לשיקום יובש, צביעה או נזק מחום.",
    usageHe:
      "אחרי שמפו – לסחוט מים מהשיער, למרוח מאמצע האורך לקצוות, להמתין 5–10 דקות ולשטוף.",
    maintenanceLevel: "medium",
    recommendationRole: "core",
    bestForHairTypes: [
      "wavy",
      "curly",
      "chemically-treated",
      "colored",
      "highlighted",
      "blonde",
      "grey",
    ],
    bestForGoals: ["repair", "smoothness", "shine"],
    climateRelevance: ["dry-air", "sun-exposure"],
    salonFit: "hybrid",
    beginnerFriendly: true,
    marketFitScore: 0.9,
  },
  {
    id: "bond-repair-treatment",
    name: "Bond Repair Treatment",
    nameHe: "טיפול שיקום סיבים (Bond Repair)",
    type: "bond-repair",
    description:
      "טיפול שיקום אינטנסיבי לסיבים כימיים וצבע, לרוב סביב מותגים מקצועיים מוכרים.",
    usageHe:
      "לפי הוראות היצרן – בדרך כלל לפני או אחרי חפיפה, להמתין ולהקפיד על זמן פעולה.",
    maintenanceLevel: "high",
    recommendationRole: "upgrade",
    bestForHairTypes: [
      "chemically-treated",
      "colored",
      "highlighted",
      "blonde",
    ],
    bestForGoals: ["repair", "smoothness"],
    climateRelevance: ["sun-exposure", "dry-air"],
    salonFit: "salon-only",
    beginnerFriendly: false,
    marketFitScore: 0.82,
    notes: "נוטה להיות מוצר יקר – מומלץ בעיקר כשיש נזק מורגש או בקו מקצועי בסלון.",
  },
  {
    id: "scalp-treatment-balance",
    name: "Scalp Balancing Treatment",
    nameHe: "טיפול איזון קרקפת",
    type: "scalp-treatment",
    description:
      "טיפול לקרקפת שומנית/מגורה, עוזר לניקוי עדין ואיזון לפני/אחרי חפיפה.",
    usageHe:
      "למרוח בקו הקרקפת על שיער לח או יבש לפי סוג המוצר, לעסות בעדינות ולשטוף לפי הצורך.",
    maintenanceLevel: "medium",
    recommendationRole: "optional",
    bestForHairTypes: ["oily-scalp", "dry-scalp"],
    bestForGoals: ["scalp-balance"],
    climateRelevance: ["heat", "humidity", "urban-pollution"],
    salonFit: "hybrid",
    beginnerFriendly: false,
    marketFitScore: 0.75,
  },
  {
    id: "color-safe-shampoo-base",
    name: "Color-Safe Shampoo",
    nameHe: "שמפו לשיער צבוע",
    type: "color-safe-shampoo",
    description:
      "שמפו עדין בלי סולפטים חזקים, שומר על צבע ומפחית ירידה מהירה של גוון.",
    usageHe:
      "לסבן בעדינות בעיקר את הקרקפת, לא לשפשף חזק את האורך, לשטוף היטב.",
    maintenanceLevel: "low",
    recommendationRole: "core",
    bestForHairTypes: ["colored", "highlighted", "blonde"],
    bestForGoals: ["color-care", "smoothness"],
    climateRelevance: ["sun-exposure", "urban-pollution"],
    salonFit: "hybrid",
    beginnerFriendly: true,
    marketFitScore: 0.93,
  },
  {
    id: "silver-shampoo-toning",
    name: "Silver / Purple Shampoo",
    nameHe: "שמפו סילבר לבלונד/שיער לבן",
    type: "silver-shampoo",
    description:
      "שמפו עם פיגמנט סגול לנטרול כתמתמות/צהבהבות בשיער בלונדיני או שיער לבן.",
    usageHe:
      "פעמיים בחודש או לפי הצורך – להשאיר על השיער 2–3 דקות ולשטוף, לא לשימוש יומיומי.",
    maintenanceLevel: "medium",
    recommendationRole: "optional",
    bestForHairTypes: ["blonde", "grey", "highlighted"],
    bestForGoals: ["color-care"],
    climateRelevance: ["sun-exposure"],
    salonFit: "hybrid",
    beginnerFriendly: false,
    marketFitScore: 0.86,
  },
  {
    id: "anti-humidity-finishing-spray",
    name: "Anti-Humidity Finishing Spray",
    nameHe: "ספריי גימור נגד לחות",
    type: "anti-humidity-spray",
    description:
      "ספריי גימור שקוף שמסייע להחזיק פן/בייביליס מול לחות, בלי מראה קשה.",
    usageHe:
      "בסיום העיצוב – לרסס במרחק קליל סביב השכבה החיצונית של השיער, לא להתקרב מדי.",
    maintenanceLevel: "medium",
    recommendationRole: "optional",
    bestForHairTypes: ["straight-fine", "straight-thick", "wavy", "curly"],
    bestForGoals: ["frizz-control", "hold"],
    climateRelevance: ["humidity", "heat"],
    salonFit: "hybrid",
    beginnerFriendly: true,
    marketFitScore: 0.88,
  },
];

// --- Recommendation helper (read-only, no commerce) ---

export interface WomenProductRecommendationView {
  id: string;
  nameHe: string;
  usageHe: string;
  recommendationRole: WomenRecommendationRole;
  reasonHe?: string;
}

const ROLE_ORDER: WomenRecommendationRole[] = ["core", "optional", "upgrade"];
const ROLE_REASON_HE: Record<WomenRecommendationRole, string> = {
  core: "מומלץ כבסיס לשגרה",
  optional: "משלים לשגרה",
  upgrade: "לשיפור מתקדם",
};

/** Returns 2–3 product recommendations for the given preset. Deterministic, salon-professional, read-only. */
export function getWomenProductRecommendations(preset: {
  maintenanceLevel: string;
  vibe: string[];
}): WomenProductRecommendationView[] {
  const maintenance = preset.maintenanceLevel as WomenMaintenanceLevel;
  const vibes = new Set(preset.vibe);

  const pool = WOMEN_PRODUCT_CATEGORIES.filter(
    (p) => p.maintenanceLevel === maintenance || p.maintenanceLevel === "medium"
  );
  const source = pool.length > 0 ? pool : WOMEN_PRODUCT_CATEGORIES;
  const scored = source.map((p) => {
    let score = p.marketFitScore;
    if (vibes.has("sleek") && (p.bestForGoals.includes("smoothness") || p.type === "heat-protectant")) score += 0.15;
    if (vibes.has("natural") && (p.bestForGoals.includes("frizz-control") || p.bestForGoals.includes("curl-definition"))) score += 0.1;
    if (vibes.has("curly") && (p.type === "curl-cream" || p.type === "curl-gel")) score += 0.2;
    if (vibes.has("low-maintenance") && p.maintenanceLevel === "low") score += 0.1;
    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const byRole: Record<WomenRecommendationRole, typeof WOMEN_PRODUCT_CATEGORIES[0] | null> = {
    core: null,
    optional: null,
    upgrade: null,
  };
  for (const { product } of scored) {
    if (!byRole[product.recommendationRole]) {
      byRole[product.recommendationRole] = product;
    }
    if (byRole.core && byRole.optional && byRole.upgrade) break;
  }

  const out: WomenProductRecommendationView[] = [];
  for (const role of ROLE_ORDER) {
    const p = byRole[role];
    if (p) {
      out.push({
        id: p.id,
        nameHe: p.nameHe,
        usageHe: p.usageHe,
        recommendationRole: p.recommendationRole,
        reasonHe: ROLE_REASON_HE[p.recommendationRole],
      });
    }
  }
  return out.slice(0, 3);
}


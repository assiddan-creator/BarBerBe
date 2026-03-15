export type WomenHairTexture = "straight" | "wavy" | "curly" | "coily" | "unknown";

export type WomenLevel = "low" | "medium" | "high";

export interface WomenAnalysisResult {
  hairTexture: WomenHairTexture;
  frizzLevel: WomenLevel;
  volumeLevel: WomenLevel;
  drynessLevel: WomenLevel;
  heatStylingFit: WomenLevel;
  maintenanceFit: WomenLevel;
  confidence: WomenLevel;
  topRecommendedStyles: string[]; // women preset ids
  personalSummaryHe?: string;
}

export function normalizeHairTexture(input: unknown): WomenHairTexture {
  if (typeof input !== "string") return "unknown";
  const value = input.toLowerCase().trim();
  switch (value) {
    case "straight":
      return "straight";
    case "wavy":
      return "wavy";
    case "curly":
      return "curly";
    case "coily":
      return "coily";
    default:
      return "unknown";
  }
}

export function normalizeLevel(input: unknown, fallback: WomenLevel = "medium"): WomenLevel {
  if (typeof input !== "string") return fallback;
  const value = input.toLowerCase().trim();
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return fallback;
}

export function normalizeWomenAnalysis(raw: any): WomenAnalysisResult {
  const hairTexture = normalizeHairTexture(raw?.hairTexture);

  const frizzLevel = normalizeLevel(raw?.frizzLevel, "medium");
  const volumeLevel = normalizeLevel(raw?.volumeLevel, "medium");
  const drynessLevel = normalizeLevel(raw?.drynessLevel, "medium");
  const heatStylingFit = normalizeLevel(raw?.heatStylingFit, "medium");
  const maintenanceFit = normalizeLevel(raw?.maintenanceFit, "medium");
  const confidence = normalizeLevel(raw?.confidence, "medium");

  const topRecommendedStyles: string[] = Array.isArray(raw?.topRecommendedStyles)
    ? raw.topRecommendedStyles.filter((id: unknown) => typeof id === "string" && id.trim().length > 0)
    : [];

  const personalSummaryHe =
    typeof raw?.personalSummaryHe === "string" && raw.personalSummaryHe.trim().length > 0
      ? raw.personalSummaryHe.trim()
      : undefined;

  return {
    hairTexture,
    frizzLevel,
    volumeLevel,
    drynessLevel,
    heatStylingFit,
    maintenanceFit,
    confidence,
    topRecommendedStyles,
    personalSummaryHe,
  };
}


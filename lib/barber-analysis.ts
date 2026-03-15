/**
 * Shared types and validation for BarBerBe grooming analysis.
 * Small schema for fast, reliable JSON output.
 */

export const VALID_BEARD_COMPATIBILITY = ["low", "medium", "high"] as const;
export const VALID_CONFIDENCE = ["low", "medium", "high"] as const;

export type BeardCompatibilityAnalysis =
  (typeof VALID_BEARD_COMPATIBILITY)[number];
export type ConfidenceLevel = (typeof VALID_CONFIDENCE)[number];

/** Max length for personalSummaryHe (≈2 short sentences). */
const PERSONAL_SUMMARY_MAX_LENGTH = 400;

/**
 * Final schema expected from the remote grooming model.
 * This intentionally omits any biometric / facial-shape fields.
 */
export interface BarberAnalysisResult {
  beardCompatibility: BeardCompatibilityAnalysis;
  beardCompatibilityHe: string;
  topRecommendedHairstyles: string[];
  topRecommendedBeards: string[];
  confidence: ConfidenceLevel;
  personalSummaryHe?: string;
  styleReasonHe?: string;
  maintenanceDirectionHe?: string;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((x) => typeof x === "string");
}

/**
 * Validates and normalizes raw model output. Returns null if too invalid.
 * Preset id filtering is done in the route.
 */
export function normalizeAnalysisOutput(
  raw: unknown
): BarberAnalysisResult | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const beardCompatibility = VALID_BEARD_COMPATIBILITY.includes(
    o.beardCompatibility as BeardCompatibilityAnalysis
  )
    ? (o.beardCompatibility as BeardCompatibilityAnalysis)
    : "medium";
  const confidence = VALID_CONFIDENCE.includes(o.confidence as ConfidenceLevel)
    ? (o.confidence as ConfidenceLevel)
    : "medium";

  const result: BarberAnalysisResult = {
    beardCompatibility,
    beardCompatibilityHe:
      typeof o.beardCompatibilityHe === "string" ? o.beardCompatibilityHe : "",
    topRecommendedHairstyles: isStringArray(o.topRecommendedHairstyles)
      ? o.topRecommendedHairstyles
      : [],
    topRecommendedBeards: isStringArray(o.topRecommendedBeards)
      ? o.topRecommendedBeards
      : [],
    confidence,
  };
  if (typeof o.personalSummaryHe === "string") {
    const trimmed = o.personalSummaryHe.trim();
    if (trimmed) {
      result.personalSummaryHe =
        trimmed.length > PERSONAL_SUMMARY_MAX_LENGTH
          ? `${trimmed.slice(0, PERSONAL_SUMMARY_MAX_LENGTH)}…`
          : trimmed;
    }
  }
  if (typeof o.styleReasonHe === "string") {
    const trimmed = o.styleReasonHe.trim();
    if (trimmed) {
      result.styleReasonHe = trimmed;
    }
  }
  if (typeof o.maintenanceDirectionHe === "string") {
    const trimmed = o.maintenanceDirectionHe.trim();
    if (trimmed) {
      result.maintenanceDirectionHe = trimmed;
    }
  }
  return result;
}

/**
 * UI-facing diagnostic summary for MEN grooming scan.
 * All values derived from analysis + preset metadata; no biometric measurement.
 */
export interface MenGroomingDiagnostic {
  /** טקסטורת שיער */
  hairTextureHe: string;
  /** נוכחות זקן */
  beardPresenceHe: string;
  /** כיוון תחזוקה */
  maintenanceDirectionHe: string;
  /** כיוון סגנוני */
  styleDirectionHe: string;
  /** התאמת עיצוב */
  stylingFitHe: string;
}

/**
 * Filter and truncate to only valid preset ids, preserving order.
 */
export function filterValidPresetIds(
  ids: string[],
  validSet: Set<string>,
  maxCount: number
): string[] {
  const out: string[] = [];
  for (const id of ids) {
    if (validSet.has(id) && out.length < maxCount) out.push(id);
  }
  return out;
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  HAIRSTYLE_PRESETS,
  BEARD_PRESETS,
  COMBO_PRESETS,
  type BarberPreset,
} from "@/lib/barber-presets";
import type {
  BarberAnalysisResult,
  MenGroomingDiagnostic,
} from "@/lib/barber-analysis";
import {
  BARBER_SELFIE_STORAGE_KEY,
  BARBER_STYLE_STORAGE_KEY,
  BARBER_HAIRSTYLE_STORAGE_KEY,
  BARBER_BEARD_STORAGE_KEY,
  BARBER_COMBO_STORAGE_KEY,
  BARBER_DEFAULT_HERO_IMAGE,
  BARBER_ANALYSIS_ENGINE_STORAGE_KEY,
  BARBER_ANALYSIS_STORAGE_KEY,
} from "@/lib/barber-session";

// Combo preset id → { hairstyleId, beardId } using only real ids from lib/barber-presets.ts
const COMBO_TO_PARTS: Record<
  string,
  { hairstyleId: string; beardId: string }
> = {
  "executive-look": { hairstyleId: "ivy-league", beardId: "corporate-beard" },
  "barbers-choice": { hairstyleId: "textured-crop", beardId: "short-boxed-beard" },
  "street-king": { hairstyleId: "clean-fade", beardId: "full-beard" },
  "clean-professional": { hairstyleId: "taper-fade", beardId: "stubble" },
  "everyday-fresh": { hairstyleId: "textured-crop", beardId: "heavy-stubble" },
  "sports-edition": { hairstyleId: "crew-cut", beardId: "stubble" },
  "israeli-modern": { hairstyleId: "taper-fade", beardId: "heavy-stubble" },
  "razor-sharp": { hairstyleId: "clean-fade", beardId: "square-short-beard" },
};

function getPresetDisplayLabel(preset: BarberPreset): string {
  return preset.displayNameHe ?? preset.nameHe;
}

// --- Local face analysis profile (mock; single source of truth for the analysis card)
// Replace later with GPT/API-driven analysis.
export type FaceShape = "oval" | "long" | "round" | "other";
export type Jawline = "balanced" | "strong" | "soft";
export type BeardCompatibility = "high" | "medium" | "low";

export interface MensAnalysisProfile {
  faceShape: FaceShape;
  jawline: Jawline;
  beardCompatibility: BeardCompatibility;
}

const MOCK_ANALYSIS_PROFILE: MensAnalysisProfile = {
  faceShape: "oval",
  jawline: "balanced",
  beardCompatibility: "high",
};

/** Map API analysis result to the profile shape used by recommendations and card. */
function analysisToProfile(analysis: BarberAnalysisResult | null): MensAnalysisProfile {
  if (!analysis) return MOCK_ANALYSIS_PROFILE;
  // The remote model no longer returns face shape / jawline.
  // We keep those fields from the local mock profile and only adapt beard compatibility.
  const faceShape = MOCK_ANALYSIS_PROFILE.faceShape;
  const jawline = MOCK_ANALYSIS_PROFILE.jawline;
  const beardCompatibility: BeardCompatibility =
    analysis.beardCompatibility === "high"
      ? "high"
      : analysis.beardCompatibility === "low"
      ? "low"
      : "medium";
  return { faceShape, jawline, beardCompatibility };
}

function getAnalysisDisplayLabels(
  profile: MensAnalysisProfile,
  analysis: BarberAnalysisResult | null,
) {
  const faceLabels: Record<FaceShape, string> = {
    oval: "אובלי",
    long: "ארוך",
    round: "עגול",
    other: "משולש",
  };
  const jawLabels: Record<Jawline, string> = {
    balanced: "מאוזן",
    strong: "חזק",
    soft: "רך",
  };
  const beardLabels: Record<BeardCompatibility, string> = {
    high: "גבוהה",
    medium: "בינונית",
    low: "נמוכה",
  };
  if (analysis) {
    return {
      // Face shape and jawline labels are local-only now; the model does not return them.
      faceShapeLabel: faceLabels[profile.faceShape],
      jawlineLabel: jawLabels[profile.jawline],
      beardCompatibilityLabel:
        analysis.beardCompatibilityHe || beardLabels[profile.beardCompatibility],
    };
  }
  return {
    faceShapeLabel: faceLabels[profile.faceShape],
    jawlineLabel: jawLabels[profile.jawline],
    beardCompatibilityLabel: beardLabels[profile.beardCompatibility],
  };
}

/**
 * Build a compact diagnostic summary from analysis + preset metadata only.
 * No biometric measurement; all values inferred from recommendations and presets.
 */
function getMenGroomingDiagnostic(
  analysis: BarberAnalysisResult | null,
  hairPreset: BarberPreset | null,
  beardPreset: BarberPreset | null
): MenGroomingDiagnostic {
  const beardPresenceLevelHe =
    analysis?.beardCompatibility === "high"
      ? "מלא ובולט"
      : analysis?.beardCompatibility === "low"
      ? "קצר או חלקי"
      : "נוכחות בינונית";

  const hairVibe = hairPreset?.vibe ?? "";
  const beardVibe = beardPreset?.vibe ?? "";
  const combinedVibe = `${hairVibe} ${beardVibe}`.toLowerCase();

  const maintenanceLevel = hairPreset?.maintenanceLevel ?? beardPreset?.maintenanceLevel ?? "medium";
  const maintenanceMap: Record<string, string> = {
    "very-low": "מינימלית",
    low: "נמוכה",
    medium: "בינונית",
    high: "גבוהה",
  };
  const maintenanceDirectionHe =
    maintenanceMap[maintenanceLevel] ?? "בינונית";

  if (!hairPreset && !beardPreset) {
    return {
      hairTextureHe: "מגוון",
      beardPresenceHe: beardPresenceLevelHe,
      maintenanceDirectionHe,
      styleDirectionHe: "כללי",
      stylingFitHe: "גמיש",
    };
  }

  let hairTextureHe = "מגוון";
  if (hairVibe) {
    if (/טקסטורה|textured|תלתל/.test(hairVibe)) hairTextureHe = "טקסטורה מודרנית";
    else if (/חלק|סליק|smooth|משוך/.test(hairVibe)) hairTextureHe = "חלק";
    else if (/גלי|wavy|רך/.test(hairVibe)) hairTextureHe = "גלי / רך";
    else hairTextureHe = hairVibe.length > 20 ? hairVibe.slice(0, 18) + "…" : hairVibe;
  }

  const beardPresenceHe = beardPresenceLevelHe;

  const styleDirectionHe =
    hairPreset?.vibe || beardPreset?.vibe || "כללי";

  let stylingFitHe = "גמיש";
  if (/טבעי|natural|מינימלי|ספורטיבי/.test(combinedVibe)) stylingFitHe = "טבעי";
  else if (/עסקי|מסודר|קלאסי|חד/.test(combinedVibe)) stylingFitHe = "מסודר";
  else if (/טקסטורה|מודרני|תנועה/.test(combinedVibe)) stylingFitHe = "טקסטורה";

  return {
    hairTextureHe,
    beardPresenceHe,
    maintenanceDirectionHe,
    styleDirectionHe,
    stylingFitHe,
  };
}

function findHairstylePresetByValue(value: string): BarberPreset | null {
  const byId = HAIRSTYLE_PRESETS.find((p) => p.id === value);
  if (byId) return byId;
  return (
    HAIRSTYLE_PRESETS.find(
      (p) => p.name === value || p.nameHe === value
    ) ?? null
  );
}

function findBeardPresetByValue(value: string): BarberPreset | null {
  const byId = BEARD_PRESETS.find((p) => p.id === value);
  if (byId) return byId;
  return (
    BEARD_PRESETS.find((p) => p.name === value || p.nameHe === value) ?? null
  );
}

// --- Rule-based recommendation engine (uses preset bestFor + analysis profile)
// Designed to be easy to replace later with GPT-driven analysis.
function scoreHairstyleForProfile(
  preset: BarberPreset,
  profile: MensAnalysisProfile
): number {
  let score = 0;
  const bestForText = preset.bestFor.join(" ").toLowerCase();

  // Face shape: prioritize presets whose bestFor mentions this face shape
  const faceKeywords: Record<FaceShape, string[]> = {
    oval: ["אובל", "אובלי"],
    long: ["ארוכות", "ארוך"],
    round: ["עגולות", "עגול"],
    other: [],
  };
  const keywords = faceKeywords[profile.faceShape] ?? [];
  if (keywords.some((k) => bestForText.includes(k))) {
    score += 3;
  }

  // Balanced/strong jawline: favor structured, office-friendly options
  if (profile.jawline === "balanced" || profile.jawline === "strong") {
    if (
      bestForText.includes("משרד") ||
      bestForText.includes("עסקי") ||
      bestForText.includes("מסודר")
    ) {
      score += 1;
    }
  }

  return score;
}

function scoreBeardForProfile(
  preset: BarberPreset,
  profile: MensAnalysisProfile
): number {
  let score = 0;
  const bestForText = preset.bestFor.join(" ").toLowerCase();
  const nameAndVibe = `${preset.nameHe} ${preset.vibe}`.toLowerCase();

  // Beard compatibility: high → favor stronger/full beard options
  if (profile.beardCompatibility === "high") {
    if (
      nameAndVibe.includes("זקן מלא") ||
      nameAndVibe.includes("זיפים מלאים") ||
      bestForText.includes("צמיחה מלאה")
    ) {
      score += 3;
    }
    if (nameAndVibe.includes("זקן קצר") || nameAndVibe.includes("זקן עסקי")) {
      score += 2;
    }
  }
  if (profile.beardCompatibility === "low") {
    if (nameAndVibe.includes("מגולח") || nameAndVibe.includes("זיפים קצרים")) {
      score += 2;
    }
  }

  // Jawline: balanced/strong → favor structured, defined options
  if (profile.jawline === "balanced" || profile.jawline === "strong") {
    if (
      bestForText.includes("קו לסת") ||
      bestForText.includes("מאוזן") ||
      nameAndVibe.includes("מרובע")
    ) {
      score += 2;
    }
  }

  return score;
}

function getTopRecommendedHairstyles(
  profile: MensAnalysisProfile,
  count: number
): BarberPreset[] {
  const withScores = HAIRSTYLE_PRESETS.map((p) => ({
    preset: p,
    score: scoreHairstyleForProfile(p, profile),
  }));
  withScores.sort((a, b) => b.score - a.score);
  return withScores.slice(0, count).map((x) => x.preset);
}

function getTopRecommendedBeards(
  profile: MensAnalysisProfile,
  count: number
): BarberPreset[] {
  const withScores = BEARD_PRESETS.map((p) => ({
    preset: p,
    score: scoreBeardForProfile(p, profile),
  }));
  withScores.sort((a, b) => b.score - a.score);
  return withScores.slice(0, count).map((x) => x.preset);
}

// --- Combo recommendation (uses bestFor, vibe, description + analysis profile)
function scoreComboForProfile(
  preset: BarberPreset,
  profile: MensAnalysisProfile
): number {
  let score = 0;
  const bestForText = preset.bestFor.join(" ");
  const vibeDesc = `${preset.vibe} ${preset.description}`;

  // Beard compatibility: high → favor combos with stronger beard; low → lighter/clean
  if (profile.beardCompatibility === "high") {
    if (
      vibeDesc.includes("זקן מלא") ||
      vibeDesc.includes("זיפים מלאים") ||
      vibeDesc.includes("זקן מודגש")
    ) {
      score += 3;
    }
    if (
      vibeDesc.includes("זקן קצר") ||
      vibeDesc.includes("זקן מטופח") ||
      bestForText.includes("עסקי")
    ) {
      score += 2;
    }
  }
  if (profile.beardCompatibility === "low") {
    if (vibeDesc.includes("מגולח") || vibeDesc.includes("זיפים קצרים")) {
      score += 2;
    }
  }

  // Jawline balanced/strong → favor structured, sharp combos
  if (profile.jawline === "balanced" || profile.jawline === "strong") {
    if (
      bestForText.includes("עסקי") ||
      vibeDesc.includes("חד") ||
      vibeDesc.includes("מאוזן")
    ) {
      score += 2;
    }
  }

  // Lifestyle: office / everyday
  if (
    bestForText.includes("משרד") ||
    bestForText.includes("יומיום") ||
    bestForText.includes("מנהלים")
  ) {
    score += 1;
  }

  return score;
}

function getTopRecommendedCombos(
  profile: MensAnalysisProfile,
  count: number
): BarberPreset[] {
  const withScores = COMBO_PRESETS.map((p) => ({
    preset: p,
    score: scoreComboForProfile(p, profile),
  }));
  withScores.sort((a, b) => b.score - a.score);
  return withScores.slice(0, count).map((x) => x.preset);
}

export default function BarberAnalysisPage() {
  const router = useRouter();
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [selectedHairstyle, setSelectedHairstyle] = useState<string | null>(
    null,
  );
  const [selectedBeard, setSelectedBeard] = useState<string | null>(null);
  const [selectedComboId, setSelectedComboId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [realAnalysis, setRealAnalysis] = useState<BarberAnalysisResult | null>(
    null,
  );
  const [engineLabel, setEngineLabel] = useState<"GPT-4o" | "Qwen2-VL">(
    "GPT-4o",
  );

  const analysisProfile = useMemo(
    () => analysisToProfile(realAnalysis),
    [realAnalysis]
  );
  const analysisLabels = useMemo(
    () => getAnalysisDisplayLabels(analysisProfile, realAnalysis),
    [analysisProfile, realAnalysis]
  );

  const recommendedHairstyles = useMemo(() => {
    if (
      realAnalysis?.topRecommendedHairstyles?.length &&
      realAnalysis.topRecommendedHairstyles.length > 0
    ) {
      const presets = realAnalysis.topRecommendedHairstyles.slice(0, 3)
        .map((id) => HAIRSTYLE_PRESETS.find((p) => p.id === id))
        .filter((p): p is BarberPreset => p != null);
      if (presets.length > 0) return presets;
    }
    return getTopRecommendedHairstyles(analysisProfile, 3);
  }, [analysisProfile, realAnalysis]);

  const recommendedBeards = useMemo(() => {
    if (
      realAnalysis?.topRecommendedBeards?.length &&
      realAnalysis.topRecommendedBeards.length > 0
    ) {
      const presets = realAnalysis.topRecommendedBeards.slice(0, 3)
        .map((id) => BEARD_PRESETS.find((p) => p.id === id))
        .filter((p): p is BarberPreset => p != null);
      if (presets.length > 0) return presets;
    }
    return getTopRecommendedBeards(analysisProfile, 3);
  }, [analysisProfile, realAnalysis]);

  const recommendedCombos = useMemo(
    () => getTopRecommendedCombos(analysisProfile, 3),
    [analysisProfile]
  );

  const diagnostic = useMemo(() => {
    const hairPreset = selectedHairstyle
      ? findHairstylePresetByValue(selectedHairstyle)
      : recommendedHairstyles[0] ?? null;
    const beardPreset = selectedBeard
      ? findBeardPresetByValue(selectedBeard)
      : recommendedBeards[0] ?? null;
    return getMenGroomingDiagnostic(realAnalysis, hairPreset, beardPreset);
  }, [
    realAnalysis,
    selectedHairstyle,
    selectedBeard,
    recommendedHairstyles,
    recommendedBeards,
  ]);

  useEffect(() => {
    if (!hydrated || !selfieUrl) return;

    let engine: "live" | "alt" = "live";
    try {
      const stored = sessionStorage.getItem(BARBER_ANALYSIS_ENGINE_STORAGE_KEY);
      if (stored === "live" || stored === "alt") {
        engine = stored;
      }
    } catch {
      // ignore
    }

    setEngineLabel(engine === "alt" ? "Qwen2-VL" : "GPT-4o");

    const endpoint =
      engine === "alt" ? "/api/barber/analyze-alt" : "/api/barber/analyze";

    let cancelled = false;
    setAnalysisLoading(true);
    setAnalysisError(null);
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: selfieUrl }),
    })
      .then((res) => res.json().catch(() => null))
      .then((data: { analysis?: BarberAnalysisResult; error?: string } | null) => {
        if (cancelled) return;
        setAnalysisLoading(false);
        if (data?.analysis) {
          if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
            const preview = (s: string | undefined) =>
              s ? `${s.slice(0, 60)}${s.length > 60 ? "…" : ""}` : "(none)";
            // eslint-disable-next-line no-console
            console.warn("[barber/analysis] API response summary:", {
              endpoint,
              personalSummaryHe: preview(data.analysis.personalSummaryHe),
            });
          }
          setRealAnalysis(data.analysis);
        } else
          setAnalysisError(
            data?.error ?? "הניתוח נכשל. נשתמש בהמלצות ברירת מחדל.",
          );
      })
      .catch(() => {
        if (!cancelled) {
          setAnalysisLoading(false);
          setAnalysisError(
            "לא ניתן לנתח את התמונה כרגע. נשתמש בהמלצות ברירת מחדל.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, selfieUrl]);

  const updateStyleCompatibility = (
    hairstyleId: string | null,
    beardId: string | null,
  ) => {
    const hasHairstyle = Boolean(hairstyleId);
    const hasBeard = Boolean(beardId);
    let combined: string | null = null;

    if (hasHairstyle && hasBeard) {
      const h = findHairstylePresetByValue(hairstyleId!);
      const b = findBeardPresetByValue(beardId!);
      combined =
        h && b ? `${h.nameHe} · ${b.nameHe}` : `${hairstyleId} · ${beardId}`;
    } else if (hasHairstyle) {
      const h = findHairstylePresetByValue(hairstyleId!);
      combined = h ? h.nameHe : hairstyleId;
    } else if (hasBeard) {
      const b = findBeardPresetByValue(beardId!);
      combined = b ? b.nameHe : beardId;
    }

    try {
      if (combined) {
        sessionStorage.setItem(BARBER_STYLE_STORAGE_KEY, combined);
      } else {
        sessionStorage.removeItem(BARBER_STYLE_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    try {
      const storedSelfie = sessionStorage.getItem(BARBER_SELFIE_STORAGE_KEY);
      const storedHairstyle = sessionStorage.getItem(
        BARBER_HAIRSTYLE_STORAGE_KEY,
      );
      const storedBeard = sessionStorage.getItem(BARBER_BEARD_STORAGE_KEY);
      const storedStyle = sessionStorage.getItem(BARBER_STYLE_STORAGE_KEY);
      const storedCombo = sessionStorage.getItem(BARBER_COMBO_STORAGE_KEY);

      setSelfieUrl(storedSelfie);

      let nextHairstyle = storedHairstyle ?? null;
      let nextBeard = storedBeard ?? null;
      let nextComboId = storedCombo ?? null;

      // If barber_combo exists and maps to parts, backfill hairstyle/beard when missing
      if (nextComboId && COMBO_TO_PARTS[nextComboId]) {
        const parts = COMBO_TO_PARTS[nextComboId];
        if (!nextHairstyle) nextHairstyle = parts.hairstyleId;
        if (!nextBeard) nextBeard = parts.beardId;
      }

      // Backwards-compatibility: infer from barber_style when needed
      if (!nextHairstyle && !nextBeard && storedStyle) {
        if (storedStyle.includes(" · ")) {
          const [hPart, bPart] = storedStyle.split(" · ");
          const hPreset = hPart ? findHairstylePresetByValue(hPart.trim()) : null;
          const bPreset = bPart ? findBeardPresetByValue(bPart.trim()) : null;
          nextHairstyle = hPreset?.id ?? (hPart?.trim() || null);
          nextBeard = bPreset?.id ?? (bPart?.trim() || null);
        } else {
          const hPreset = findHairstylePresetByValue(storedStyle);
          const bPreset = findBeardPresetByValue(storedStyle);
          if (storedStyle === "זקן קצר") {
            nextBeard = findBeardPresetByValue("זקן קצר ומדויק")?.id ?? "short-boxed-beard";
          } else if (hPreset) {
            nextHairstyle = hPreset.id;
          } else if (bPreset) {
            nextBeard = bPreset.id;
          }
        }
      }

      // Normalize to preset ids when we have legacy display strings
      if (nextHairstyle) {
        const hPreset = findHairstylePresetByValue(nextHairstyle);
        if (hPreset) nextHairstyle = hPreset.id;
      }
      if (nextBeard) {
        const bPreset = findBeardPresetByValue(nextBeard);
        if (bPreset) nextBeard = bPreset.id;
      }

      // If no stored combo but current h+b match a combo mapping, show that combo as selected
      if (!nextComboId && nextHairstyle && nextBeard) {
        const matchingCombo = Object.entries(COMBO_TO_PARTS).find(
          ([_, parts]) =>
            parts.hairstyleId === nextHairstyle && parts.beardId === nextBeard
        );
        if (matchingCombo) nextComboId = matchingCombo[0];
      }

      setSelectedHairstyle(nextHairstyle);
      setSelectedBeard(nextBeard);
      setSelectedComboId(nextComboId);

      updateStyleCompatibility(nextHairstyle, nextBeard);
    } catch {
      // ignore storage errors
    } finally {
      setHydrated(true);
    }
  }, []);

  const handleGoBack = () => {
    router.push("/barber");
  };

  const handleSelectHairstyle = (presetId: string) => {
    setSelectedHairstyle(presetId);
    setSelectedComboId(null);
    try {
      sessionStorage.setItem(BARBER_HAIRSTYLE_STORAGE_KEY, presetId);
      sessionStorage.removeItem(BARBER_COMBO_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    updateStyleCompatibility(presetId, selectedBeard);
  };

  const handleSelectBeard = (presetId: string) => {
    setSelectedBeard(presetId);
    setSelectedComboId(null);
    try {
      sessionStorage.setItem(BARBER_BEARD_STORAGE_KEY, presetId);
      sessionStorage.removeItem(BARBER_COMBO_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    updateStyleCompatibility(selectedHairstyle, presetId);
  };

  const handleSelectCombo = (comboId: string) => {
    const parts = COMBO_TO_PARTS[comboId];
    if (!parts) return;
    setSelectedComboId(comboId);
    setSelectedHairstyle(parts.hairstyleId);
    setSelectedBeard(parts.beardId);
    try {
      sessionStorage.setItem(BARBER_COMBO_STORAGE_KEY, comboId);
      sessionStorage.setItem(BARBER_HAIRSTYLE_STORAGE_KEY, parts.hairstyleId);
      sessionStorage.setItem(BARBER_BEARD_STORAGE_KEY, parts.beardId);
    } catch {
      // ignore storage errors
    }
    updateStyleCompatibility(parts.hairstyleId, parts.beardId);
  };

  const handleContinue = () => {
    if (!selfieUrl) {
      router.push("/barber");
      return;
    }

    const hasHairstyle = Boolean(selectedHairstyle);
    const hasBeard = Boolean(selectedBeard);
    if (!hasHairstyle && !hasBeard) {
      return;
    }

    try {
      if (selectedHairstyle) {
        sessionStorage.setItem(BARBER_HAIRSTYLE_STORAGE_KEY, selectedHairstyle);
      }
      if (selectedBeard) {
        sessionStorage.setItem(BARBER_BEARD_STORAGE_KEY, selectedBeard);
      }
      updateStyleCompatibility(selectedHairstyle, selectedBeard);
      if (realAnalysis) {
        const parts = [
          realAnalysis.personalSummaryHe,
          realAnalysis.styleReasonHe,
          realAnalysis.maintenanceDirectionHe,
        ].filter(Boolean);
        sessionStorage.setItem(
          BARBER_ANALYSIS_STORAGE_KEY,
          parts.join(" "),
        );
      }
    } catch {
      // ignore storage errors
    }

    router.push("/barber/preview");
  };

  if (!hydrated) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#040406] text-white flex items-center justify-center px-4 py-6 sm:py-10"
      >
        <p className="text-sm text-[#00FFD1]/80">טוען מסך הניתוח של BarBerBe…</p>
      </main>
    );
  }

  if (!selfieUrl) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#040406] text-white flex items-center justify-center px-4 py-6 sm:py-10"
      >
        <section className="w-full max-w-lg rounded-3xl border border-[#00FFD1]/30 bg-[#0a0a0f] px-6 py-8 space-y-4 text-center shadow-[0_0_8px_rgba(0,255,209,0.3)] overflow-hidden">
          <div className="relative aspect-[4/3] w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-[#00FFD1]/40 bg-black">
            <img
              src={BARBER_DEFAULT_HERO_IMAGE}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="text-lg sm:text-xl font-semibold mb-1 text-[#00FFD1]">
            ניתוח פנים AI
          </h1>
          <p className="text-sm text-[#9CA3AF]">
            לא נמצאה תמונה לניתוח. חזור למסך ההעלאה והעלה סלפי חדש.
          </p>
          <button
            type="button"
            onClick={handleGoBack}
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-[#00FFD1]/50 bg-[#0a0a0f] px-5 py-2.5 text-sm text-[#00FFD1] transition-all hover:shadow-[0_0_10px_rgba(0,255,209,0.35)]"
          >
            חזור למסך ההעלאה
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#040406] text-white flex items-center justify-center px-4 py-6 sm:py-10"
    >
      <section className="w-full max-w-5xl rounded-3xl border border-[#00FFD1]/30 bg-[#0a0a0f] px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 space-y-8 shadow-[0_0_8px_rgba(0,255,209,0.3)]">
        <div className="relative">
          <Link
            href="/barber"
            className="absolute top-0 right-0 inline-flex items-center gap-2 rounded-xl border border-[#00FFD1]/50 bg-[#0a0a0f] px-3 py-2 text-sm text-[#00FFD1] transition-all z-10 hover:shadow-[0_0_12px_rgba(0,255,209,0.4)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>ראשי</span>
          </Link>
        </div>
        <header className="space-y-3 text-center">
          <div className="flex items-baseline justify-center gap-3">
            <p className="text-xs sm:text-xs tracking-[0.18em] text-[#A8A8B3]">
              BarBerBe
            </p>
            <p className="text-xs sm:text-xs tracking-[0.18em] uppercase text-[#A8A8B3] whitespace-nowrap">
              YOUR PERSONAL STYLE ADVISOR
            </p>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold">
              ניתוח פנים AI
            </h1>
            <p className="text-sm sm:text-sm text-[#A8A8B3]">
              בחר תספורת, זקן או לוק מלא לפי ניתוח הפנים שלך
            </p>
            <p className="text-[11px] sm:text-xs text-[#6B7280] mt-1">
              מנוע ניתוח: {engineLabel}
            </p>
          </div>
        </header>

        <div className="space-y-6 lg:space-y-7">
          {/* Uploaded selfie — cyan scan line when analysis loading */}
          <section className="rounded-2xl border border-[#00FFD1]/30 bg-[#0f0f18] p-4 sm:p-5 flex flex-col gap-3 animate-barber-fade-in shadow-[0_0_8px_rgba(0,255,209,0.2)]">
            <div className="flex flex-col items-center justify-center gap-1 text-center">
              <p className="text-xs tracking-[0.22em] text-[#00FFD1]/70 uppercase">
                VISUAL ANALYSIS
              </p>
            </div>
            <div className="relative border border-[#00FFD1]/25 rounded-2xl overflow-hidden bg-[#050509] aspect-[4/3] lg:max-h-[600px]">
              <img
                src={selfieUrl}
                alt="הסלפי שהועלה"
                className="w-full h-full object-contain object-center"
              />
              {analysisLoading && (
                <>
                  <div className="absolute inset-0 pointer-events-none border border-[#00FFD1]/20 rounded-2xl" aria-hidden />
                  <div className="absolute top-2 right-2 left-2 h-px bg-gradient-to-l from-transparent via-[#00FFD1]/40 to-transparent" aria-hidden />
                  <div className="absolute bottom-2 right-2 left-2 h-px bg-gradient-to-l from-transparent via-[#00FFD1]/40 to-transparent" aria-hidden />
                  <div className="absolute top-2 bottom-2 right-2 w-px bg-gradient-to-b from-transparent via-[#00FFD1]/40 to-transparent" aria-hidden />
                  <div className="absolute top-2 bottom-2 left-2 w-px bg-gradient-to-b from-transparent via-[#00FFD1]/40 to-transparent" aria-hidden />
                  <div className="absolute inset-0 pointer-events-none rounded-2xl" aria-hidden>
                    <span className="absolute w-1 h-1 rounded-full bg-[#00FFD1]/30 top-[20%] left-1/2 -translate-x-1/2" />
                    <span className="absolute w-1 h-1 rounded-full bg-[#00FFD1]/25 top-[50%] left-1/2 -translate-x-1/2" />
                    <span className="absolute w-1 h-1 rounded-full bg-[#00FFD1]/25 bottom-[30%] left-1/2 -translate-x-1/2" />
                  </div>
                  <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none" aria-hidden>
                    <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#00FFD1] to-transparent animate-barber-scan-line shadow-[0_0_10px_rgba(0,255,209,0.5)]" style={{ animationDuration: "2s" }} />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Analysis and recommendations — biometric readout panel */}
          <section className="rounded-2xl border border-[#00FFD1]/30 bg-[#0a0a0f] p-5 sm:p-6 flex flex-col gap-5 min-h-[320px] animate-barber-scale-in shadow-[0_0_8px_rgba(0,255,209,0.2)]">
            {analysisLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center py-14 px-4 text-center rounded-2xl border border-[#00FFD1]/30 bg-[#080810] shadow-[0_0_8px_rgba(0,255,209,0.2)]">
                <div className="h-12 w-12 rounded-full border border-[#00FFD1]/40 border-t-[#00FFD1] animate-spin mb-5" />
                <p className="text-base font-medium text-[#00FFD1]">
                  BarBerBe מנתח את מבנה הפנים שלך…
                </p>
                <p className="text-sm text-[#9CA3AF] mt-2">
                  זה לוקח כמה שניות
                </p>
                <div className="mt-4 flex gap-1.5" aria-hidden>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00FFD1]/30 animate-pulse" style={{ animationDelay: "0s" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00FFD1]/50 animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00FFD1] animate-pulse" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <h2 className="text-sm font-semibold text-[#00FFD1]">
                    פרופיל BarBerBe — BIOMETRIC READOUT
                  </h2>
                  <p className="text-sm text-[#9CA3AF]">
                    {realAnalysis
                      ? "סיכום מבני קצר לפני בחירת הלוק"
                      : "לאחר הסריקה נציג כאן סיכום מבני קצר והמלצות ראשוניות"}
                  </p>
                </div>

                {analysisError && (
                  <div className="rounded-2xl border border-[#00FFD1]/20 bg-[#0f0f18] px-4 py-3 text-right">
                    <p className="text-sm text-[#E5E7EB]">{analysisError}</p>
                  </div>
                )}

                <div className="mt-1 space-y-3 text-sm rounded-2xl border border-[#00FFD1]/25 bg-[#080810] px-4 py-3 shadow-[0_0_6px_rgba(0,255,209,0.15)]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#00FFD1]/80">התאמה לזקן</span>
                    <span className="text-[#00FFD1]">{analysisLabels.beardCompatibilityLabel}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#00FFD1]/25 bg-[#080810] px-4 py-3 space-y-2.5 shadow-[0_0_6px_rgba(0,255,209,0.15)]">
                  <p className="text-xs tracking-[0.12em] uppercase text-[#00FFD1]/70 mb-1.5 text-center">
                    פלט סריקה
                  </p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-right">
                    <div className="flex justify-between gap-3 sm:block">
                      <dt className="text-[#00FFD1]/70 shrink-0">אווירה סגנונית</dt>
                      <dd className="text-white/95">{diagnostic.hairTextureHe}</dd>
                    </div>
                    <div className="flex justify-between gap-3 sm:block">
                      <dt className="text-[#00FFD1]/70 shrink-0">נוכחות זקן</dt>
                      <dd className="text-white/95">{diagnostic.beardPresenceHe}</dd>
                    </div>
                    <div className="flex justify-between gap-3 sm:block">
                      <dt className="text-[#00FFD1]/70 shrink-0">כיוון תחזוקה</dt>
                      <dd className="text-white/95">{diagnostic.maintenanceDirectionHe}</dd>
                    </div>
                    <div className="flex justify-between gap-3 sm:block">
                      <dt className="text-[#00FFD1]/70 shrink-0">כיוון סגנוני</dt>
                      <dd className="text-white/95">{diagnostic.styleDirectionHe}</dd>
                    </div>
                    <div className="flex justify-between gap-3 sm:block sm:col-span-2">
                      <dt className="text-[#00FFD1]/70 shrink-0">התאמת עיצוב</dt>
                      <dd className="text-white/95">{diagnostic.stylingFitHe}</dd>
                    </div>
                  </dl>
                </div>

                {realAnalysis?.personalSummaryHe && (
                  <div className="rounded-2xl border border-[#00FFD1]/25 bg-[#0a0a12] px-4 py-3 text-center space-y-1.5 shadow-[0_0_6px_rgba(0,255,209,0.15)]">
                    <p className="text-sm font-medium text-[#00FFD1]/80">
                      סיכום אישי
                    </p>
                    <p className="text-sm text-white/95 leading-relaxed">
                      {realAnalysis.personalSummaryHe}
                    </p>
                    {(realAnalysis.styleReasonHe ||
                      realAnalysis.maintenanceDirectionHe) && (
                      <p className="text-xs text-[#9CA3AF] leading-relaxed">
                        {[realAnalysis.styleReasonHe, realAnalysis.maintenanceDirectionHe]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-1 space-y-5 text-center">
              {/* Recommended hairstyles (top 3) — preset buttons with cyan glow */}
              <div className="space-y-2 flex flex-col items-center">
                <h3 className="text-sm font-medium text-[#00FFD1]">
                  התספורות המומלצות עבורך
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {recommendedHairstyles.map((preset) => {
                    const isActive = selectedHairstyle === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectHairstyle(preset.id)}
                        className={`rounded-xl px-3 py-2 text-sm border transition-all ${
                          isActive
                            ? "border-[#00FFD1] bg-[#00FFD1]/10 text-[#00FFD1] shadow-[0_0_8px_rgba(0,255,209,0.35)]"
                            : "border-[#00FFD1]/35 bg-[#0a0a0f] text-white hover:border-[#00FFD1]/60 hover:shadow-[0_0_8px_rgba(0,255,209,0.25)]"
                        }`}
                      >
                        <span className="inline-flex flex-col items-center text-center">
                          <span>{getPresetDisplayLabel(preset)}</span>
                          {preset.displayNameHe && (
                            <span className="text-xs text-[#A8A8B3] mt-0.5">
                              {preset.nameHe}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* All hairstyles */}
              <div className="space-y-2 flex flex-col items-center">
<h3 className="text-sm font-medium text-[#00FFD1]/80">
                כל התספורות
              </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {HAIRSTYLE_PRESETS.map((preset) => {
                    const isActive = selectedHairstyle === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectHairstyle(preset.id)}
                        className={`rounded-xl px-3 py-2 text-sm border transition-all ${
                          isActive
                            ? "border-[#00FFD1] bg-[#00FFD1]/10 text-[#00FFD1] shadow-[0_0_8px_rgba(0,255,209,0.35)]"
                            : "border-[#00FFD1]/35 bg-[#0a0a0f] text-white hover:border-[#00FFD1]/60 hover:shadow-[0_0_8px_rgba(0,255,209,0.25)]"
                        }`}
                      >
                        <span className="inline-flex flex-col items-center text-center">
                          <span>{getPresetDisplayLabel(preset)}</span>
                          {preset.displayNameHe && (
                            <span className="text-xs text-[#A8A8B3] mt-0.5">
                              {preset.nameHe}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recommended beards (top 3) */}
              <div className="space-y-2 flex flex-col items-center">
                <h3 className="text-sm font-medium text-[#00FFD1]">
                  סגנונות הזקן המומלצים עבורך
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {recommendedBeards.map((preset) => {
                    const isActive = selectedBeard === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectBeard(preset.id)}
                        className={`rounded-xl px-3 py-2 text-sm border transition-all ${
                          isActive
                            ? "border-[#00FFD1] bg-[#00FFD1]/10 text-[#00FFD1] shadow-[0_0_8px_rgba(0,255,209,0.35)]"
                            : "border-[#00FFD1]/35 bg-[#0a0a0f] text-white hover:border-[#00FFD1]/60 hover:shadow-[0_0_8px_rgba(0,255,209,0.25)]"
                        }`}
                      >
                        <span className="inline-flex flex-col items-center text-center">
                          <span>{getPresetDisplayLabel(preset)}</span>
                          {preset.displayNameHe && (
                            <span className="text-xs text-[#A8A8B3] mt-0.5">
                              {preset.nameHe}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* All beards */}
              <div className="space-y-2 flex flex-col items-center">
                <h3 className="text-xs font-medium text-[#00FFD1]/80">
                  כל סגנונות הזקן
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {BEARD_PRESETS.map((preset) => {
                    const isActive = selectedBeard === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectBeard(preset.id)}
                        className={`rounded-xl px-3 py-2 text-xs sm:text-sm border transition-all ${
                          isActive
                            ? "border-[#00FFD1] bg-[#00FFD1]/10 text-[#00FFD1] shadow-[0_0_8px_rgba(0,255,209,0.35)]"
                            : "border-[#00FFD1]/35 bg-[#0a0a0f] text-white hover:border-[#00FFD1]/60 hover:shadow-[0_0_8px_rgba(0,255,209,0.25)]"
                        }`}
                      >
                        <span className="inline-flex flex-col items-center text-center">
                          <span>{getPresetDisplayLabel(preset)}</span>
                          {preset.displayNameHe && (
                            <span className="text-[10px] text-[#A8A8B3] mt-0.5">
                              {preset.nameHe}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recommended full-look combos (top 3) */}
              <div className="space-y-2 pt-2 border-t border-[#00FFD1]/25 flex flex-col items-center">
                <h3 className="text-sm font-medium text-[#00FFD1]">
                  הלוקים המלאים המומלצים עבורך
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {recommendedCombos.map((preset) => {
                    const isActive = selectedComboId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectCombo(preset.id)}
                        className={`rounded-xl px-3 py-2 text-sm border transition-all ${
                          isActive
                            ? "border-[#00FFD1] bg-[#00FFD1]/10 text-[#00FFD1] shadow-[0_0_8px_rgba(0,255,209,0.35)]"
                            : "border-[#00FFD1]/35 bg-[#0a0a0f] text-white hover:border-[#00FFD1]/60 hover:shadow-[0_0_8px_rgba(0,255,209,0.25)]"
                        }`}
                      >
                        <span className="inline-flex flex-col items-center text-center">
                          <span>{getPresetDisplayLabel(preset)}</span>
                          {preset.displayNameHe && (
                            <span className="text-xs text-[#A8A8B3] mt-0.5">
                              {preset.nameHe}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
              </>
            )}
          </section>
        </div>

        <section className="pt-1 space-y-2 text-center">
          {(() => {
            const hasHairstyle = Boolean(selectedHairstyle);
            const hasBeard = Boolean(selectedBeard);
            let label = "בחר סגנון כדי להמשיך";
            let disabled = true;

            if (hasHairstyle && hasBeard) {
              label = "✨ המשך ללוק המלא";
              disabled = false;
            } else if (hasHairstyle) {
              label = "✂️ המשך לתצוגת התספורת";
              disabled = false;
            } else if (hasBeard) {
              label = "🧔 המשך לתצוגת הזקן";
              disabled = false;
            }

            return (
              <button
                type="button"
                onClick={disabled ? undefined : handleContinue}
                disabled={disabled}
                className={`w-full rounded-xl py-3.5 text-sm sm:text-base transition-all border ${
                  disabled
                    ? "bg-[#0a0a0f] text-[#666677] cursor-not-allowed border-[#00FFD1]/20"
                    : "border-[#00FFD1] bg-[#0a0a0f] text-[#00FFD1] font-semibold shadow-[0_0_8px_rgba(0,255,209,0.3)] hover:shadow-[0_0_16px_rgba(0,255,209,0.45)] hover:bg-[#00FFD1]/10"
                }`}
              >
                {label}
              </button>
            );
          })()}

          <p className="text-sm text-[#9CA3AF]">
            המסך הבא יציג הדמיית תוצאה מבוססת AI (עדיין תצוגת דמה)
          </p>
        </section>
      </section>
    </main>
  );
}


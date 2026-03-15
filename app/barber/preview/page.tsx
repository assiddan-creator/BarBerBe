"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  HAIRSTYLE_PRESETS,
  BEARD_PRESETS,
  type BarberPreset,
} from "@/lib/barber-presets";
import {
  getBarberProductRecommendations,
  type ProductRecommendationView,
} from "@/lib/barber-products";
import {
  BARBER_SELFIE_STORAGE_KEY,
  BARBER_STYLE_STORAGE_KEY,
  BARBER_HAIRSTYLE_STORAGE_KEY,
  BARBER_BEARD_STORAGE_KEY,
} from "@/lib/barber-session";
import { GenerationLoadingOverlay } from "@/components/GenerationLoadingOverlay";

function resolveHairstylePreset(value: string | null): BarberPreset | null {
  if (!value) return null;
  const byId = HAIRSTYLE_PRESETS.find((p) => p.id === value);
  if (byId) return byId;
  return (
    HAIRSTYLE_PRESETS.find(
      (p) => p.name === value || p.nameHe === value
    ) ?? null
  );
}

function resolveBeardPreset(value: string | null): BarberPreset | null {
  if (!value) return null;
  const byId = BEARD_PRESETS.find((p) => p.id === value);
  if (byId) return byId;
  return (
    BEARD_PRESETS.find((p) => p.name === value || p.nameHe === value) ?? null
  );
}

function formatMaintenanceLevel(
  level: BarberPreset["maintenanceLevel"],
): { label: string; badgeClass: string } {
  switch (level) {
    case "very-low":
      return {
        label: "תחזוקה מאוד נמוכה",
        badgeClass:
          "border-emerald-500/40 bg-emerald-900/40 text-emerald-200",
      };
    case "low":
      return {
        label: "תחזוקה נמוכה",
        badgeClass: "border-emerald-500/40 bg-emerald-900/40 text-emerald-100",
      };
    case "medium":
      return {
        label: "תחזוקה בינונית",
        badgeClass: "border-sky-500/40 bg-sky-900/40 text-sky-100",
      };
    case "high":
    default:
      return {
        label: "תחזוקה גבוהה",
        badgeClass: "border-[#4B5563] bg-[#1F2937] text-[#D1D5DB]",
      };
  }
}

function mergeMaintenanceLevel(
  a: BarberPreset["maintenanceLevel"],
  b: BarberPreset["maintenanceLevel"],
): BarberPreset["maintenanceLevel"] {
  const order: BarberPreset["maintenanceLevel"][] = [
    "very-low",
    "low",
    "medium",
    "high",
  ];
  return order[Math.max(order.indexOf(a), order.indexOf(b))] ?? a;
}

function getDisplayName(preset: BarberPreset | null): string {
  if (!preset) return "";
  return preset.displayNameHe ?? preset.nameHe;
}

const MODEL_OPTIONS = [
  { label: "Nano Banana Pro", value: "google/nano-banana-pro" },
  { label: "Nano Banana 2", value: "google/nano-banana-2" },
  { label: "Flux 2 Pro", value: "black-forest-labs/flux-2-pro" },
  { label: "Flux Kontext Pro", value: "black-forest-labs/flux-kontext-pro" },
] as const;

function ProductRecommendationsSection({
  products,
}: {
  products: ProductRecommendationView[];
}) {
  if (!products.length) return null;
  return (
    <div className="space-y-2 pt-4 border-t border-[#2A2A3A] text-right">
      <p className="text-sm sm:text-[13px] font-medium text-[#6B7280] uppercase tracking-[0.2em]">
        מה יעזור לך לשמור על הלוק
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {products.map((prod) => (
          <div
            key={prod.id}
            className="min-w-[9rem] max-w-[13rem] rounded-2xl border border-[#1F2933] bg-[#05050a] px-3 py-2.5 flex flex-col gap-1"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-[#E5E7EB]">
                {prod.nameHe}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  prod.role === 0
                    ? "border-emerald-500/50 text-emerald-200"
                    : prod.role === 1
                    ? "border-[#4B5563] text-[#D1D5DB]"
                    : "border-[#4B5563] text-[#D1D5DB]"
                }`}
              >
                {prod.role === 0
                  ? "ליבה"
                  : prod.role === 1
                  ? "אופציונלי"
                  : "שדרוג"}
              </span>
            </div>
            <p className="text-sm text-[#9CA3AF] leading-snug">
              {prod.usageHe}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BarberPreviewPage() {
  const router = useRouter();
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedHairstyle, setSelectedHairstyle] = useState<string | null>(
    null,
  );
  const [selectedBeard, setSelectedBeard] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBarberMode, setIsBarberMode] = useState(false);
  type ComparisonView = "after" | "before" | "compare";
  const [comparisonView, setComparisonView] = useState<ComparisonView>("after");
  const [selectedModel, setSelectedModel] = useState<string>(
    "google/nano-banana-pro",
  );
  const [changeIntensity, setChangeIntensity] = useState(100);

  const handleDownloadImage = async () => {
    if (!generatedUrl) return;
    try {
      const res = await fetch(generatedUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `barberai-result-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(generatedUrl, "_blank");
    }
  };

  useEffect(() => {
    try {
      const storedSelfie = sessionStorage.getItem(BARBER_SELFIE_STORAGE_KEY);
      const storedStyle = sessionStorage.getItem(BARBER_STYLE_STORAGE_KEY);
      const storedHairstyle = sessionStorage.getItem(
        BARBER_HAIRSTYLE_STORAGE_KEY,
      );
      const storedBeard = sessionStorage.getItem(BARBER_BEARD_STORAGE_KEY);
      setSelfieUrl(storedSelfie);
      setSelectedStyle(storedStyle);

      let hairstyle = storedHairstyle;
      let beard = storedBeard;

      // Backwards compatibility: infer hairstyle / beard from barber_style when needed
      if (!hairstyle && !beard && storedStyle) {
        if (storedStyle.includes(" · ")) {
          const [h, b] = storedStyle.split(" · ");
          hairstyle = h || null;
          beard = b || null;
        } else if (storedStyle.includes("זקן")) {
          beard = storedStyle;
        } else {
          hairstyle = storedStyle;
        }
      }

      setSelectedHairstyle(hairstyle ?? null);
      setSelectedBeard(beard ?? null);
    } catch {
      // ignore storage errors
    } finally {
      setHydrated(true);
    }
  }, []);

  const handleBackToAnalysis = () => {
    if (isGenerating) return;
    router.push("/barber/analysis");
  };

  const handleRestart = () => {
    if (isGenerating) return;
    try {
      sessionStorage.removeItem(BARBER_SELFIE_STORAGE_KEY);
      sessionStorage.removeItem(BARBER_STYLE_STORAGE_KEY);
      sessionStorage.removeItem(BARBER_HAIRSTYLE_STORAGE_KEY);
      sessionStorage.removeItem(BARBER_BEARD_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    router.push("/barber");
  };

  const hasHairstyle = Boolean(selectedHairstyle);
  const hasBeard = Boolean(selectedBeard);

  const hairstylePreset = resolveHairstylePreset(selectedHairstyle);
  const beardPreset = resolveBeardPreset(selectedBeard);

  const productRecommendations: ProductRecommendationView[] = useMemo(() => {
    if (!hairstylePreset && !beardPreset) return [];
    const mergedMaintRaw =
      hairstylePreset && beardPreset
        ? "medium"
        : (hairstylePreset ?? beardPreset)?.maintenanceLevel ?? "medium";

    // Map preset maintenance (which may include 'very-low') into product schema (low | medium | high)
    const mergedMaint =
      mergedMaintRaw === "high"
        ? "high"
        : mergedMaintRaw === "medium"
        ? "medium"
        : "low";

    return getBarberProductRecommendations({
      hairstyleId: hairstylePreset?.id ?? selectedHairstyle ?? undefined,
      beardId: beardPreset?.id ?? selectedBeard ?? undefined,
      maintenanceLevel: mergedMaint,
      hairstyleVibe: hairstylePreset?.vibe ?? null,
      beardVibe: beardPreset?.vibe ?? null,
      hasBeard: Boolean(beardPreset || selectedBeard),
      isCleanShaven:
        !beardPreset &&
        (!selectedBeard || /clean|מגולח/i.test(selectedBeard)),
    });
  }, [hairstylePreset, beardPreset, selectedHairstyle, selectedBeard]);

  type PreviewMode = "hairstyle" | "beard" | "combo" | null;
  let mode: PreviewMode = null;
  if (hasHairstyle && !hasBeard) {
    mode = "hairstyle";
  } else if (!hasHairstyle && hasBeard) {
    mode = "beard";
  } else if (hasHairstyle && hasBeard) {
    mode = "combo";
  }

  if (!hydrated) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-4 py-6 sm:py-10"
      >
        <p className="text-base sm:text-lg text-[#A8A8B3]">
          טוען מסך התוצאה של BarBerBe…
        </p>
      </main>
    );
  }

  if (!selfieUrl || (!hasHairstyle && !hasBeard && !selectedStyle)) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-4 py-6 sm:py-10"
      >
        <section className="w-full max-w-lg rounded-3xl border border-[#2A2A3A] bg-[#050509] px-6 py-8 space-y-4 text-center shadow-[0_24px_80px_rgba(0,0,0,0.75)]">
          <h1 className="text-xl sm:text-2xl font-semibold mb-1">
            תצוגת תוצאה
          </h1>
          <p className="text-[13px] sm:text-sm text-[#A8A8B3] leading-relaxed">
            חסרים נתונים להצגת התוצאה. חזור למסך ההעלאה של BarBerBe והעלה סלפי
            חדש.
          </p>
          <button
            type="button"
            onClick={() => router.push("/barber")}
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-[#2A2A3A] bg-[#101018] px-5 py-2.5 text-sm sm:text-base text-white hover:bg-[#181826] hover:border-[#374151] transition-colors"
          >
            חזור למסך ההעלאה
          </button>
        </section>
      </main>
    );
  }

  const handleGenerate = async () => {
    if (isGenerating) return;
    if (!mode || !selfieUrl) return;

    setIsGenerating(true);
    setHasGenerated(false);
    setGeneratedUrl(null);
    setError(null);

    try {
      let prompt: string;
      if (mode === "hairstyle" && hairstylePreset) {
        prompt = hairstylePreset.aiPrompt;
      } else if (mode === "beard" && beardPreset) {
        prompt = beardPreset.aiPrompt;
      } else if (mode === "combo" && hairstylePreset && beardPreset) {
        prompt =
          `High-end barbershop combo edit. Keep the same person, face, skin tone, lighting and background. Apply both changes in one image. (1) Hairstyle: ${hairstylePreset.aiPrompt} (2) Beard: ${beardPreset.aiPrompt} Final image must show one person with both the new hairstyle and new beard, photorealistic.`;
      } else {
        const hairstyleText = hairstylePreset?.nameHe ?? selectedHairstyle ?? "";
        const beardText = beardPreset?.nameHe ?? selectedBeard ?? "";
        prompt =
          `High-end barbershop image edit. Change to match: "${hairstyleText}"${beardText ? ` / "${beardText}"` : ""}. Preserve the person's identity, lighting and realism.`;
      }

      const res = await fetch("/api/barber/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: selfieUrl,
          prompt,
          type: mode,
          model: selectedModel,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { imageUrl?: string; error?: string }
        | null;

      if (!res.ok || !data || !data.imageUrl) {
        const message =
          (data && data.error) ||
          `הפקת התמונה נכשלה (קוד ${res.status}). נסה שוב בעוד רגע.`;
        throw new Error(message);
      }

      setGeneratedUrl(data.imageUrl);
      setHasGenerated(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "הפקת התמונה נכשלה. נסה שוב בעוד רגע.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#080808] text-white px-4 py-6 sm:py-10"
    >
      <section className="w-full max-w-6xl mx-auto rounded-3xl border border-[#2A2A3A] bg-gradient-to-b from-[#11111a] via-[#080808] to-[#050509] shadow-[0_24px_80px_rgba(0,0,0,0.75)] px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 space-y-8 animate-barber-fade-in">
        <div className="relative">
          <Link
            href="/barber"
            className="absolute top-0 right-0 inline-flex items-center gap-2 rounded-xl border border-[#2A2A3A] bg-[#08080f] px-3 py-2 text-sm text-[#A8A8B3] hover:text-white hover:border-[#374151] transition-colors z-10"
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
            <p className="text-[10px] sm:text-xs tracking-[0.18em] text-[#A8A8B3]">
              BarBerBe
            </p>
            <p className="text-[10px] sm:text-xs tracking-[0.18em] uppercase text-[#A8A8B3] whitespace-nowrap">
              YOUR PERSONAL STYLE ADVISOR
            </p>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold">
              {mode === "hairstyle"
                ? "תצוגת תספורת"
                : mode === "beard"
                ? "תצוגת זקן"
                : mode === "combo"
                ? "תצוגת לוק מלא"
                : "תצוגת תוצאה"}
            </h1>
            <p className="text-[13px] sm:text-sm text-[#A8A8B3]">
              זהו מסך תצוגת ההדמיה לפני חיבור למנוע ה-AI האמיתי
            </p>
          </div>
        </header>

        {/* Responsive layout: on mobile stacked, on desktop two columns (image left, consultation right) */}
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-2 items-start">
          {/* Left column: hero result + original selfie (when relevant) */}
          <div className="space-y-5">
            {/* 1) Result slot: strict-sized wrapper, image(s) absolute, loading overlay on top */}
            <section
              className="rounded-2xl border border-[#2A2A3A] bg-[#050509] overflow-hidden w-full"
              aria-label="תוצאת ההדמיה"
            >
              {hasGenerated && generatedUrl && selfieUrl && (
                <div className="w-full animate-barber-result-reveal">
                  <div className="flex items-center justify-center gap-0 px-2 py-2 border-b border-[#2A2A3A]">
                    <div
                      className="flex rounded-full border border-[#2A2A3A] bg-[#0a0a12] p-0.5"
                      role="group"
                      aria-label="תצוגת השוואה"
                    >
                      <button
                        type="button"
                        onClick={() => setComparisonView("after")}
                        className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                          comparisonView === "after"
                            ? "bg-cyan-500/10 text-white border border-cyan-500/30"
                            : "text-[#A8A8B3] hover:text-white bg-transparent border border-transparent"
                        }`}
                      >
                        אחרי
                      </button>
                      <button
                        type="button"
                        onClick={() => setComparisonView("before")}
                        className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                          comparisonView === "before"
                            ? "bg-cyan-500/10 text-white border border-cyan-500/30"
                            : "text-[#A8A8B3] hover:text-white bg-transparent border border-transparent"
                        }`}
                      >
                        לפני
                      </button>
                      <button
                        type="button"
                        onClick={() => setComparisonView("compare")}
                        className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                          comparisonView === "compare"
                            ? "bg-cyan-500/10 text-white border border-cyan-500/30"
                            : "text-[#A8A8B3] hover:text-white bg-transparent border border-transparent"
                        }`}
                      >
                        השוואה
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Strict wrapper: never changes size */}
              <div className="relative w-full aspect-[3/4] max-h-[55vh] md:max-h-[600px] bg-[#050509] rounded-xl overflow-hidden border border-white/10">
                {selfieUrl && !(hasGenerated && generatedUrl) && (
                  <>
                    <img
                      src={selfieUrl}
                      alt="הסלפי שהועלה"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                    {isGenerating && <GenerationLoadingOverlay />}
                  </>
                )}
                {hasGenerated && generatedUrl && selfieUrl && !isGenerating && (
                  <>
                    {comparisonView === "after" && (
                      <>
                        <img
                          src={selfieUrl}
                          alt="הסלפי המקורי"
                          className="absolute inset-0 w-full h-full object-contain"
                          aria-hidden
                        />
                        <img
                          src={generatedUrl}
                          alt="תוצאת ה-AI של BarBerBe"
                          className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150"
                          style={{ opacity: changeIntensity / 100 }}
                        />
                      </>
                    )}
                    {comparisonView === "before" && (
                      <img
                        src={selfieUrl}
                        alt="הסלפי המקורי"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    )}
                    {comparisonView === "compare" && (
                      <div className="absolute inset-0 w-full h-full grid grid-cols-2 gap-2 p-2">
                        <div className="relative overflow-hidden rounded-lg bg-[#0a0a12]">
                          <img
                            src={selfieUrl}
                            alt="לפני"
                            className="absolute inset-0 w-full h-full object-contain"
                          />
                        </div>
                        <div className="relative overflow-hidden rounded-lg bg-[#0a0a12]">
                          <img
                            src={generatedUrl}
                            alt="אחרי"
                            className="absolute inset-0 w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
                {!selfieUrl && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-5 py-10 text-center">
                    <p className="text-[13px] sm:text-sm text-[#A8A8B3] leading-relaxed">
                      העלה סלפי במסך ההעלאה כדי להמשיך
                    </p>
                  </div>
                )}
              </div>

              {hasGenerated && generatedUrl && selfieUrl && (
                <>
                  {comparisonView === "after" && (
                    <div className="px-4 py-3 border-t border-[#2A2A3A] space-y-2">
                      <label className="block text-sm text-[#A8A8B3] text-right">
                        עוצמת השינוי: {changeIntensity}%
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={changeIntensity}
                        onChange={(e) =>
                          setChangeIntensity(Number(e.target.value))
                        }
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[#1F2937] accent-cyan-500"
                      />
                    </div>
                  )}
                  <div className="px-4 py-3 border-t border-[#2A2A3A] flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
                    <p className="text-sm text-[#A8A8B3] text-right leading-relaxed order-2 sm:order-1">
                      {comparisonView === "after" &&
                        "תוצאת ההדמיה שלך — הדמיה בלבד לפני חיבור למנוע התמונות הסופי"}
                      {comparisonView === "before" && "הסלפי המקורי שהועלה"}
                      {comparisonView === "compare" &&
                        "השוואה: לפני ואחרי — תוצאת ההדמיה"}
                    </p>
                    {(comparisonView === "after" ||
                      comparisonView === "compare") && (
                      <div className="flex justify-center w-full sm:w-auto order-1 sm:order-2">
                        <button
                          type="button"
                          onClick={handleDownloadImage}
                          className="rounded-xl border border-[#374151] bg-[#101018] px-4 py-2 text-sm font-medium text-white hover:bg-[#181826] hover:border-[#4B5563] transition-colors"
                        >
                          הורד תמונה
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>

            {/* Original selfie below hero (hidden once a generated result exists) */}
            {!(hasGenerated && generatedUrl) && (
              <section className="rounded-2xl border border-[#2A2A3A] bg-[#0f0f18] p-4 sm:p-5 flex flex-col gap-3">
                <h2 className="text-sm font-medium text-[#A8A8B3] text-right">
                  הסלפי המקורי
                </h2>
                <div className="border border-[#2A2A3A] rounded-2xl overflow-hidden bg-[#050509] aspect-[4/3] lg:max-h-[600px] flex items-center justify-center">
                  <img
                    src={selfieUrl}
                    alt="הסלפי שהועלה"
                    className="w-full h-full object-contain object-center"
                  />
                </div>
                <p className="text-[13px] sm:text-sm text-[#A8A8B3] text-right min-h-[1.5rem] leading-relaxed">
                  {mode === "hairstyle" &&
                    (hairstylePreset || selectedHairstyle) && (
                      <>
                        תספורת נבחרה:{" "}
                        <span className="text-white font-medium">
                          {getDisplayName(hairstylePreset) || selectedHairstyle}
                        </span>
                      </>
                    )}
                  {mode === "beard" && (beardPreset || selectedBeard) && (
                    <>
                      זקן נבחר:{" "}
                      <span className="text-white font-medium">
                        {getDisplayName(beardPreset) || selectedBeard}
                      </span>
                    </>
                  )}
                  {mode === "combo" &&
                    (hairstylePreset ||
                      beardPreset ||
                      selectedHairstyle ||
                      selectedBeard) && (
                      <>
                        לוק נבחר:{" "}
                        <span className="text-white font-medium">
                          {getDisplayName(hairstylePreset) ||
                            selectedHairstyle}
                          {(hairstylePreset ?? selectedHairstyle) &&
                          (beardPreset ?? selectedBeard)
                            ? " + "
                            : ""}
                          {getDisplayName(beardPreset) || selectedBeard}
                        </span>
                      </>
                    )}
                </p>
              </section>
            )}
          </div>

          {/* Right column: consultation card with customer / barber mode toggle */}
          <div className="lg:sticky lg:top-8">
          {(hairstylePreset || beardPreset) ? (
            <section className="rounded-2xl border border-[#2A2A3A] bg-[#050509] p-5 sm:p-6 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-base font-semibold text-white text-center">
                  כרטיס ייעוץ אישי
                </h2>
                <div className="flex rounded-full border border-[#2A2A3A] bg-[#0a0a12] p-0.5 w-full sm:w-auto" role="group" aria-label="מצב תצוגה">
                  <button
                    type="button"
                    onClick={() => setIsBarberMode(false)}
                    className={`flex-1 sm:flex-none sm:px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      !isBarberMode
                        ? "bg-cyan-500/10 text-white border border-cyan-500/30"
                        : "text-[#A8A8B3] hover:text-white bg-transparent border border-transparent"
                    }`}
                  >
                    מצב לקוח
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBarberMode(true)}
                    className={`flex-1 sm:flex-none sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isBarberMode
                        ? "bg-cyan-500/10 text-white border border-cyan-500/30"
                        : "text-[#A8A8B3] hover:text-white bg-transparent border border-transparent"
                    }`}
                  >
                    מצב ספר
                  </button>
                </div>
              </div>

              {mode === "combo" && hairstylePreset && beardPreset ? (
                <div className="space-y-5 text-right">
                  {!isBarberMode ? (
                    <>
                      <div className="space-y-2">
                        <p className="text-xs sm:text-[13px] font-medium text-[#A8A8B3] uppercase tracking-wide text-center">
                          הלוק שנבחר עבורך
                        </p>
                        <p className="text-lg sm:text-xl font-semibold text-white text-center">
                          {getDisplayName(hairstylePreset)} + {getDisplayName(beardPreset)}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center text-[11px] sm:text-xs">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${formatMaintenanceLevel(mergeMaintenanceLevel(hairstylePreset.maintenanceLevel, beardPreset.maintenanceLevel)).badgeClass}`}>
                            <span className="h-2 w-2 rounded-full bg-current opacity-80" />
                            {formatMaintenanceLevel(mergeMaintenanceLevel(hairstylePreset.maintenanceLevel, beardPreset.maintenanceLevel)).label}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2A2A3A] bg-[#101018] px-2.5 py-1 text-[#E5E5F0]">
                            האופי של הלוק: {[hairstylePreset.vibe, beardPreset.vibe].filter(Boolean).join(" · ")}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 pt-4 border-t border-[#2A2A3A] text-right">
                        <p className="text-xs sm:text-[13px] font-medium text-[#A8A8B3] uppercase tracking-wide">
                          למה זה יכול להתאים לך
                        </p>
                        <p className="text-[13px] sm:text-sm text-[#A8A8B3] leading-relaxed">
                          {(hairstylePreset.resultUserText || beardPreset.resultUserText)
                            ? [hairstylePreset.resultUserText, beardPreset.resultUserText].filter(Boolean).join(" ")
                            : `תספורת: ${hairstylePreset.description} זקן: ${beardPreset.description}`}
                        </p>
                      </div>

                      <ProductRecommendationsSection
                        products={productRecommendations}
                      />
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <p className="text-xs sm:text-[13px] font-medium text-[#A8A8B3] uppercase tracking-wide">
                          שם מקצועי
                        </p>
                        <p className="text-lg sm:text-xl font-semibold text-white">
                          {hairstylePreset.nameHe} + {beardPreset.nameHe}
                        </p>
                      </div>
                      {(hairstylePreset.resultBarberSummary || beardPreset.resultBarberSummary) && (
                        <div className="space-y-2 pt-4 border-t border-[#2A2A3A]">
                          <p className="text-xs sm:text-[13px] font-medium text-[#A8A8B3] uppercase tracking-wide">
                            סיכום לספר
                          </p>
                          <p className="text-[13px] sm:text-sm text-[#E5E7EB] leading-relaxed">
                            {[hairstylePreset.resultBarberSummary, beardPreset.resultBarberSummary].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      )}
                      {((hairstylePreset.resultTechnicalNotes?.length ?? 0) + (beardPreset.resultTechnicalNotes?.length ?? 0)) > 0 && (
                        <div className="space-y-2 pt-4 border-t border-[#2A2A3A]">
                          <p className="text-xs sm:text-[13px] font-medium text-[#A8A8B3] uppercase tracking-wide">
                            ביצוע טכני / נקודות חשובות
                          </p>
                          <ul className="text-[13px] sm:text-sm text-[#A8A8B3] list-disc list-inside space-y-1 leading-relaxed">
                            {[...(hairstylePreset.resultTechnicalNotes ?? []), ...(beardPreset.resultTechnicalNotes ?? [])].map((note, i) => (
                              <li key={i}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (() => {
                const p = hairstylePreset ?? beardPreset!;
                const maint = formatMaintenanceLevel(p.maintenanceLevel);
                return (
                  <div className="space-y-5 text-right">
                    {!isBarberMode ? (
                      <>
                        <div className="space-y-2">
                          <p className="text-xs sm:text-[13px] font-medium text-[#A8A8B3] uppercase tracking-wide text-center">
                            הלוק שנבחר עבורך
                          </p>
                          <p className="text-lg sm:text-xl font-semibold text-white text-center">
                            {getDisplayName(p)}
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center text-[11px] sm:text-xs">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${maint.badgeClass}`}>
                              <span className="h-2 w-2 rounded-full bg-current opacity-80" />
                              {maint.label}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2A2A3A] bg-[#101018] px-2.5 py-1 text-[#E5E5F0]">
                              האופי של הלוק: {p.vibe}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 pt-4 border-t border-[#2A2A3A] text-right">
                          <p className="text-xs sm:text-[13px] font-medium text-[#A8A8B3] uppercase tracking-wide">
                            למה זה יכול להתאים לך
                          </p>
                          <p className="text-[13px] sm:text-sm text-[#A8A8B3] leading-relaxed">
                            {p.resultUserText ?? p.description}
                          </p>
                        </div>

                        {productRecommendations.length > 0 && (
                          <div className="space-y-2 pt-4 border-t border-[#2A2A3A] text-right">
                            <p className="text-xs sm:text-[13px] font-medium text-[#A8A8B3] uppercase tracking-wide">
                              מה יעזור לך לשמור על הלוק
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {productRecommendations.map((prod) => (
                                <div
                                  key={prod.id}
                                  className="min-w-[9rem] max-w-[13rem] rounded-2xl border border-[#2A2A3A] bg-[#06060d] px-3 py-2.5 flex flex-col gap-1"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[13px] font-medium text-white">
                                      {prod.nameHe}
                                    </span>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                        prod.role === 0
                                          ? "border-emerald-500/50 text-emerald-200"
                                          : prod.role === 1
                                          ? "border-[#4B5563] text-[#D1D5DB]"
                                          : "border-[#4B5563] text-[#D1D5DB]"
                                      }`}
                                    >
                                      {prod.role === 0
                                        ? "ליבה"
                                        : prod.role === 1
                                        ? "אופציונלי"
                                        : "שדרוג"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <p className="text-xs sm:text-[13px] font-medium text-[#A8A8B3] uppercase tracking-wide">
                            שם מקצועי
                          </p>
                          <p className="text-lg sm:text-xl font-semibold text-white">
                            {p.nameHe}
                          </p>
                        </div>
                        {p.resultBarberSummary && (
                          <div className="space-y-2 pt-4 border-t border-[#2A2A3A]">
                            <p className="text-xs sm:text-[13px] font-medium text-[#A8A8B3] uppercase tracking-wide">
                              סיכום לספר
                            </p>
                            <p className="text-[13px] sm:text-sm text-[#E5E7EB] leading-relaxed">
                              {p.resultBarberSummary}
                            </p>
                          </div>
                        )}
                        {p.resultTechnicalNotes && p.resultTechnicalNotes.length > 0 && (
                          <div className="space-y-2 pt-4 border-t border-[#2A2A3A]">
                            <p className="text-xs sm:text-[13px] font-medium text-[#A8A8B3] uppercase tracking-wide">
                              ביצוע טכני / נקודות חשובות
                            </p>
                            <ul className="text-[13px] sm:text-sm text-[#A8A8B3] list-disc list-inside space-y-1 leading-relaxed">
                              {p.resultTechnicalNotes.map((note, i) => (
                                <li key={i}>{note}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}
            </section>
          ) : (
            <section className="rounded-2xl border border-[#2A2A3A] bg-[#050509] p-5 sm:p-6 flex flex-col">
              <h2 className="text-sm font-semibold text-right mb-2">כרטיס תוצאה</h2>
              <p className="text-sm text-[#A8A8B3] text-right">
                בחר תספורת ו/או זקן למעלה — התוצאה תופיע בחלק העליון
              </p>
            </section>
          )}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/70 bg-red-900/30 px-5 py-4 text-sm text-red-100 text-right">
            {error}
          </div>
        )}

        <section className="pt-1 space-y-3">
          <div className="space-y-3">
            <p className="text-xs sm:text-sm font-medium text-[#A8A8B3] text-center">
              בחר מודל AI
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {MODEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedModel(opt.value)}
                  disabled={isGenerating}
                  className={`rounded-xl px-3 py-2 text-sm border transition-all duration-200 ${
                    selectedModel === opt.value
                      ? "border-cyan-500/40 bg-cyan-500/10 text-white"
                      : "border-[#2A2A3A] bg-[#101018] text-white hover:bg-[#181826] hover:border-[#374151]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1 text-center">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !mode}
              className={`w-full rounded-xl px-5 py-3 text-sm sm:text-base text-center transition-all duration-200 ${
                isGenerating || !mode
                  ? "bg-[#181818] text-[#666677] cursor-not-allowed border border-[#2A2A3A]"
                  : "bg-gradient-to-l from-cyan-400 via-cyan-500 to-blue-500 text-black font-semibold shadow-[0_0_20px_rgba(34,211,238,0.12)] hover:brightness-[1.03] hover:shadow-[0_0_24px_rgba(34,211,238,0.16)]"
              }`}
            >
              {isGenerating &&
                mode === "hairstyle" &&
                "יוצר תצוגת תספורת..."}
              {isGenerating &&
                mode === "beard" &&
                "יוצר תצוגת זקן..."}
              {isGenerating &&
                mode === "combo" &&
                "יוצר לוק מלא..."}
              {!isGenerating && hasGenerated && mode && "צור מחדש"}
              {!isGenerating && !hasGenerated && mode === "hairstyle" && "✂️ צור תצוגת תספורת"}
              {!isGenerating && !hasGenerated && mode === "beard" && "🧔 צור תצוגת זקן"}
              {!isGenerating && !hasGenerated && mode === "combo" && "✨ צור לוק מלא"}
              {!isGenerating && !mode && "תצוגת תוצאה"}
            </button>
            {!hasGenerated && (
              <p className="text-[11px] text-[#A8A8B3]">
                זוהי תצוגת דמה לפני חיבור למנוע התמונות
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <button
              type="button"
              onClick={handleBackToAnalysis}
              disabled={isGenerating}
              className={`w-full sm:w-auto rounded-xl border border-[#2A2A3A] px-5 py-3 text-sm text-center transition-all duration-200 ${
                isGenerating
                  ? "bg-[#101018] text-[#666677] cursor-not-allowed"
                  : "bg-[#101018] text-white hover:bg-[#181826] hover:border-[#374151]"
              }`}
            >
              חזור לניתוח
            </button>
            <button
              type="button"
              onClick={handleRestart}
              disabled={isGenerating}
              className={`w-full sm:w-auto rounded-xl border border-[#374151] px-5 py-3 text-sm text-center transition-all duration-200 ${
                isGenerating
                  ? "bg-[#181818] text-[#666677] cursor-not-allowed border border-[#2A2A3A]"
                  : "bg-[#101018] text-white hover:bg-[#181826] hover:border-[#4B5563]"
              }`}
            >
              התחל מחדש
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}


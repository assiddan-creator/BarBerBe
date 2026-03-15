"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BARBER_SELFIE_STORAGE_KEY,
  BARBER_WOMEN_STYLE_STORAGE_KEY,
  BARBER_WOMEN_GENERATED_IMAGE_STORAGE_KEY,
  BARBER_DEFAULT_HERO_IMAGE,
} from "@/lib/barber-session";
import { WOMEN_PRESETS, type WomenPreset } from "@/lib/women-presets";
import { GenerationLoadingOverlay } from "@/components/GenerationLoadingOverlay";
import {
  getWomenProductRecommendations,
  type WomenProductRecommendationView,
} from "@/lib/women-products";

function resolveWomenPreset(styleId: string | null): WomenPreset | null {
  if (!styleId) return null;
  return WOMEN_PRESETS.find((p) => p.id === styleId) ?? null;
}

function maintenanceLabel(level: WomenPreset["maintenanceLevel"]): string {
  switch (level) {
    case "low":
      return "תחזוקה נמוכה";
    case "medium":
      return "תחזוקה בינונית";
    case "high":
      return "תחזוקה גבוהה";
    default:
      return "";
  }
}

function roleLabel(role: WomenProductRecommendationView["recommendationRole"]): string {
  switch (role) {
    case "core":
      return "ליבה";
    case "optional":
      return "אופציונלי";
    case "upgrade":
      return "שדרוג";
    default:
      return "";
  }
}

function WomenProductsSection({ products }: { products: WomenProductRecommendationView[] }) {
  if (!products.length) return null;
  return (
    <div className="space-y-2 pt-4 border-t border-[#00FFD1]/20 w-full flex flex-col items-center">
      <p className="text-xs font-medium text-[#00FFD1] uppercase tracking-widest text-center">
        מה יעזור לך לשמור על הלוק
      </p>
      <div className="flex flex-wrap gap-2 justify-center w-full">
        {products.map((prod) => (
          <div
            key={prod.id}
            className="min-w-[10rem] max-w-[14rem] rounded-xl border border-[#00FFD1]/30 bg-[#0f0f18] px-3 py-2.5 flex flex-col gap-1.5 text-center shadow-[0_0_8px_rgba(0,255,209,0.15)]"
          >
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-[13px] font-medium text-[#E5E7EB]">
                {prod.nameHe}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                  prod.recommendationRole === "core"
                    ? "border-[#00FFD1]/50 text-[#00FFD1]"
                    : prod.recommendationRole === "optional"
                    ? "border-[#00FFD1]/30 text-[#00FFD1]/80"
                    : "border-[#00FFD1]/20 text-[#9CA3AF]"
                }`}
              >
                {roleLabel(prod.recommendationRole)}
              </span>
            </div>
            <p className="text-sm text-[#9CA3AF] leading-snug text-center">
              {prod.usageHe}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WomenPreviewPage() {
  const router = useRouter();
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [styleId, setStyleId] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [imageView, setImageView] = useState<"before" | "after">("after");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(BARBER_SELFIE_STORAGE_KEY);
      if (stored && (stored.startsWith("http") || stored.startsWith("data:image/"))) {
        setSelfieUrl(stored);
      }
      const id = sessionStorage.getItem(BARBER_WOMEN_STYLE_STORAGE_KEY);
      if (id) setStyleId(id);
      const gen = sessionStorage.getItem(BARBER_WOMEN_GENERATED_IMAGE_STORAGE_KEY);
      if (gen && (gen.startsWith("http") || gen.startsWith("data:image/"))) {
        setGeneratedUrl(gen);
      }
    } catch {
      // ignore
    }
  }, []);

  const preset = resolveWomenPreset(styleId);
  const hasSelfie = !!selfieUrl;
  const hasStyle = !!preset;
  const canGenerate = hasSelfie && hasStyle && !isGenerating;
  const productRecommendations = useMemo(
    () => (preset ? getWomenProductRecommendations(preset) : []),
    [preset]
  );

  const handleGenerate = async () => {
    if (!canGenerate || !selfieUrl || !styleId) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/barber/women/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: selfieUrl, styleId }),
      });
      const data = (await res.json().catch(() => null)) as
        | { imageUrl?: string; error?: string }
        | null;
      if (!res.ok || !data?.imageUrl) {
        throw new Error(data?.error ?? "הדמיה נכשלה. נסי שוב בעוד רגע.");
      }
      setGeneratedUrl(data.imageUrl);
      try {
        sessionStorage.setItem(BARBER_WOMEN_GENERATED_IMAGE_STORAGE_KEY, data.imageUrl);
      } catch {
        // ignore
      }
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "הדמיה נכשלה. נסי שוב בעוד רגע."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (hasSelfie && !hasStyle) {
    return (
      <main className="min-h-screen bg-[#040406] text-white flex flex-col" dir="rtl">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8 py-10 space-y-6 text-center">
          <h1 className="text-xl font-semibold text-[#00FFD1] tracking-widest">כרטיס ייעוץ שיער</h1>
          <p className="text-sm text-[#00FFD1]/80">
            יש תמונה, אבל עדיין לא נבחר כיוון עיצוב.
          </p>
          <p className="text-sm text-[#00FFD1]/70">
            חזרי למסך הניתוח כדי לבחור כיוון ולהמשיך להדמיה.
          </p>
          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={() => router.push("/barber/women/analysis")}
              className="rounded-xl border border-[#00FFD1]/30 bg-[#0a0a0f] px-4 py-2.5 text-sm text-[#00FFD1] transition-all shadow-[0_0_8px_rgba(0,255,209,0.2)] hover:shadow-[0_0_12px_rgba(0,255,209,0.35)]"
            >
              חזרה למסך הניתוח
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!hasSelfie && !hasStyle) {
    return (
      <main className="min-h-screen bg-[#040406] text-white flex flex-col" dir="rtl">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8 py-10 space-y-6 text-center">
          <h1 className="text-xl font-semibold text-[#00FFD1] tracking-widest">כרטיס ייעוץ שיער</h1>
          <p className="text-sm text-[#00FFD1]/80">
            לא נמצאה תמונה או כיוון עיצוב שמור. חזרי לניתוח או למסך ההעלאה.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => router.push("/barber/women/analysis")}
              className="rounded-xl border border-[#00FFD1]/30 bg-[#0a0a0f] px-4 py-2.5 text-sm text-[#00FFD1] transition-all shadow-[0_0_8px_rgba(0,255,209,0.2)] hover:shadow-[0_0_12px_rgba(0,255,209,0.35)]"
            >
              חזרה לניתוח
            </button>
            <button
              type="button"
              onClick={() => router.push("/barber")}
              className="rounded-xl border border-[#00FFD1]/50 bg-[#0a0a0f] px-4 py-2.5 text-sm text-[#00FFD1] transition-all hover:shadow-[0_0_10px_rgba(0,255,209,0.35)]"
            >
              חזרה למסך ההעלאה
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#040406] text-white px-4 py-6 sm:py-10" dir="rtl">
      <section className="w-full max-w-6xl mx-auto rounded-3xl border border-[#00FFD1]/30 bg-[#0a0a0f] px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 space-y-8 shadow-[0_0_8px_rgba(0,255,209,0.3)]">
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
        <header className="space-y-1 flex flex-col items-center justify-center text-center">
          <p className="text-xs tracking-widest text-[#00FFD1]">
            BarBerBe WOMEN / PREVIEW
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#00FFD1] tracking-widest">
            כרטיס ייעוץ – כיוון נבחר
          </h1>
          <p className="text-base text-[#00FFD1]/80 max-w-xl mx-auto leading-relaxed">
            סיכום הייעוץ לפי הכיוון שנבחר. צרי הדמיה כדי לראות את הלוק.
          </p>
        </header>

        {/* Responsive layout: mobile stacked, desktop 2 columns (image left, consultation right) */}
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-2 items-start">
          {/* Left column: image container (result or selfie) — centered on mobile */}
          <div className="space-y-5 flex flex-col items-center justify-center w-full">
            <section
              className="rounded-2xl border border-[#00FFD1]/30 bg-[#0f0f18] overflow-hidden w-full max-w-full mx-auto shadow-[0_0_8px_rgba(0,255,209,0.2)]"
              aria-label="תוצאת ההדמיה"
            >
              {generatedUrl && hasSelfie && (
                <div className="flex items-center justify-center gap-0 px-2 py-2 border-b border-[#00FFD1]/20">
                  <div
                    className="flex rounded-full border border-[#00FFD1]/40 bg-[#080810] p-0.5 shadow-[0_0_6px_rgba(0,255,209,0.15)]"
                    role="group"
                    aria-label="תצוגת לפני/אחרי"
                  >
                    <button
                      type="button"
                      onClick={() => setImageView("after")}
                      className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                        imageView === "after"
                          ? "bg-[#00FFD1]/15 text-[#00FFD1] border border-[#00FFD1]/50 shadow-[0_0_6px_rgba(0,255,209,0.2)]"
                          : "text-[#9CA3AF] hover:text-[#00FFD1]"
                      }`}
                    >
                      אחרי
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageView("before")}
                      className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                        imageView === "before"
                          ? "bg-[#00FFD1]/15 text-[#00FFD1] border border-[#00FFD1]/50 shadow-[0_0_6px_rgba(0,255,209,0.2)]"
                          : "text-[#9CA3AF] hover:text-[#00FFD1]"
                      }`}
                    >
                      לפני
                    </button>
                  </div>
                </div>
              )}

              <div className="relative w-full aspect-[3/4] max-h-[55vh] md:max-h-[600px] bg-[#080808] rounded-xl overflow-hidden border border-[#00FFD1]/25 shadow-[0_0_8px_rgba(0,255,209,0.15)]">
                {selfieUrl && !generatedUrl && (
                  <>
                    <img
                      src={selfieUrl}
                      alt="הסלפי שהועלה"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                    {isGenerating && <GenerationLoadingOverlay />}
                    {!canGenerate && !isGenerating && (
                      <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/50 px-4">
                        <p className="text-sm text-[#E5E7EB] text-center">
                          בחרי כיוון במסך הניתוח כדי ליצור הדמיה
                        </p>
                      </div>
                    )}
                  </>
                )}
                {generatedUrl && hasSelfie && !isGenerating && (
                  <img
                    src={imageView === "before" ? selfieUrl! : generatedUrl}
                    alt={imageView === "before" ? "הסלפי שהועלה" : "הדמיית הלוק"}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                )}
                {!selfieUrl && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-5 py-10 text-center">
                    <p className="text-[13px] sm:text-sm text-[#A8A8B3] leading-relaxed">
                      העלי תמונה במסך ההעלאה כדי לאפשר הדמיה
                    </p>
                  </div>
                )}
              </div>

              {generatedUrl && hasSelfie && (
                <p className="text-sm text-[#00FFD1]/70 text-center py-2 px-2 border-t border-[#00FFD1]/20">
                  {imageView === "before"
                    ? "לפני – התמונה שהועלתה"
                    : "אחרי – תוצאת ההדמיה לפי הכיוון שנבחר"}
                </p>
              )}
            </section>

            {/* Original selfie below (when no generated result yet) */}
            {!generatedUrl && hasSelfie && (
              <section className="rounded-2xl border border-[#00FFD1]/30 bg-[#0f0f18] p-4 sm:p-5 flex flex-col gap-3 items-center w-full max-w-full mx-auto shadow-[0_0_8px_rgba(0,255,209,0.2)]">
                <h2 className="text-sm font-medium text-[#00FFD1] tracking-widest text-center">
                  התמונה שהועלתה
                </h2>
                <div className="border border-[#00FFD1]/25 rounded-2xl overflow-hidden bg-[#080808] aspect-[4/3] lg:max-h-[600px] flex items-center justify-center shadow-[0_0_6px_rgba(0,255,209,0.15)]">
                  <img
                    src={selfieUrl!}
                    alt="הסלפי שהועלה"
                    className="w-full h-full object-contain object-center"
                  />
                </div>
              </section>
            )}
          </div>

          {/* Right column: Consultation Card + Stylist Guidance + products + actions */}
          <div className="space-y-5 lg:sticky lg:top-8 flex flex-col items-center sm:items-stretch">
            <section className="rounded-2xl border border-[#00FFD1]/30 bg-[#0f0f18] p-5 sm:p-6 flex flex-col gap-4 w-full max-w-full text-center shadow-[0_0_8px_rgba(0,255,209,0.2)]">
              <h2 className="text-base font-semibold text-[#00FFD1] tracking-widest">
                כרטיס ייעוץ אישי
              </h2>

              {preset ? (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[#00FFD1]/80 uppercase tracking-widest">
                      כיוון נבחר
                    </p>
                    <p className="text-lg sm:text-xl font-semibold text-white">
                      {preset.displayNameHe}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00FFD1]/30 bg-[#080808] px-2.5 py-1 text-xs text-[#00FFD1]/90">
                        {maintenanceLabel(preset.maintenanceLevel)}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-[#00FFD1]/30 bg-[#080808] px-2.5 py-1 text-xs text-[#00FFD1]/90">
                        {preset.vibe.join(" · ")}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-[#D1D5DB] leading-relaxed text-center">
                    {preset.description}
                  </p>

                  <div className="pt-2 border-t border-[#00FFD1]/20 space-y-3 text-center">
                    <div>
                      <p className="text-sm font-medium text-[#00FFD1]/80 uppercase tracking-widest mb-1">
                        למה זה יכול להתאים
                      </p>
                      <p className="text-base text-[#E5E7EB] leading-relaxed">
                        {preset.resultUserText}
                      </p>
                    </div>
                  </div>

                  {/* Generate button inside Consultation Card (pre-generation) */}
                  {canGenerate && !generatedUrl && (
                    <div className="pt-3 border-t border-[#00FFD1]/20 space-y-2">
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full rounded-xl border border-[#00FFD1] bg-[#0a0a0f] text-[#00FFD1] font-semibold px-5 py-3 text-sm shadow-[0_0_8px_rgba(0,255,209,0.3)] hover:shadow-[0_0_16px_rgba(0,255,209,0.45)] hover:bg-[#00FFD1]/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        צור הדמיית לוק
                      </button>
                      <p className="text-[11px] text-[#00FFD1]/70 text-center">
                        ההדמיה תופיע בעמודה השמאלית
                      </p>
                    </div>
                  )}

                  {generatedUrl && (
                    <div className="mt-2 rounded-xl border border-[#00FFD1]/25 bg-[#080808] px-4 py-3 text-center shadow-[0_0_6px_rgba(0,255,209,0.15)]">
                      <p className="text-sm text-[#00FFD1]/80 leading-relaxed">
                        ההדמיה הופקה לפי הכיוון שנבחר.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[#00FFD1]/70 text-center">
                  בחרי כיוון במסך הניתוח כדי לראות כאן את סיכום הייעוץ.
                </p>
              )}
            </section>

            {preset && (preset.resultStylistSummary || preset.resultTechnicalNotes) && (
              <section className="rounded-2xl border border-[#00FFD1]/30 bg-[#0f0f18] p-5 sm:p-6 space-y-3 w-full max-w-full text-center shadow-[0_0_8px_rgba(0,255,209,0.2)]">
                <h2 className="text-sm sm:text-base font-semibold text-[#00FFD1] tracking-widest">
                  הכוונה למעצב/ת השיער
                </h2>
                {preset.resultStylistSummary && (
                  <p className="text-sm text-[#D1D5DB] leading-relaxed">
                    {preset.resultStylistSummary}
                  </p>
                )}
                {preset.resultTechnicalNotes && (
                  <p className="text-[12px] text-[#9CA3AF] leading-relaxed">
                    {preset.resultTechnicalNotes}
                  </p>
                )}
              </section>
            )}

            {productRecommendations.length > 0 && (
              <div>
                <WomenProductsSection products={productRecommendations} />
              </div>
            )}

            <section className="flex flex-col sm:flex-row gap-3 justify-center pt-1 w-full">
              <button
                type="button"
                onClick={() => router.push("/barber/women/analysis")}
                className="rounded-xl border border-[#00FFD1]/50 bg-[#0a0a0f] px-4 py-2.5 text-sm text-[#00FFD1] transition-all hover:shadow-[0_0_10px_rgba(0,255,209,0.35)]"
              >
                חזרה לניתוח
              </button>
              <button
                type="button"
                onClick={() => router.push("/barber")}
                className="rounded-xl border border-[#00FFD1]/50 bg-[#0a0a0f] px-4 py-2.5 text-sm text-[#00FFD1] transition-all hover:shadow-[0_0_10px_rgba(0,255,209,0.35)]"
              >
                חזרה למסך ההעלאה
              </button>
            </section>
          </div>
        </div>

        {generateError && (
          <div className="rounded-xl border border-[#00FFD1]/30 bg-[#0f0f18] px-4 py-3 text-right shadow-[0_0_6px_rgba(0,255,209,0.2)]">
            <p className="text-sm text-[#E5E7EB]">{generateError}</p>
          </div>
        )}
      </section>
    </main>
  );
}

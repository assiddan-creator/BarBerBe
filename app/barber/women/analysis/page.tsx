"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BARBER_SELFIE_STORAGE_KEY,
  BARBER_DEFAULT_HERO_IMAGE,
  BARBER_WOMEN_STYLE_STORAGE_KEY,
  BARBER_ANALYSIS_ENGINE_STORAGE_KEY,
} from "@/lib/barber-session";
import {
  WomenAnalysisResult,
  WomenHairTexture,
  WomenLevel,
} from "@/lib/women-analysis";
import { WOMEN_PRESETS, WomenPreset } from "@/lib/women-presets";

function createFoundationAnalysis(): WomenAnalysisResult {
  const texture: WomenHairTexture = "wavy";
  const level: WomenLevel = "medium";

  return {
    hairTexture: texture,
    frizzLevel: level,
    volumeLevel: level,
    drynessLevel: level,
    heatStylingFit: level,
    maintenanceFit: level,
    confidence: level,
    topRecommendedStyles: [
      "soft-layered-lob",
      "soft-long-layers",
      "face-framing-layers",
    ],
    personalSummaryHe:
      "כרגע המערכת עובדת על ניתוח בסיסי ומוכנה להתחבר למנוע AI מלא – הדגש הוא על טקסטורה, נפח ורמת תחזוקה, כדי להציע כיווני עיצוב שמתאימים לחיים בישראל.",
  };
}

function getWomenPresetRecommendations(analysis: WomenAnalysisResult): WomenPreset[] {
  const primary: WomenPreset[] = [];

  const v1Presets = WOMEN_PRESETS.filter((p) => p.phase === "v1");
  const byId = new Map(v1Presets.map((p) => [p.id, p]));
  for (const id of analysis.topRecommendedStyles) {
    const preset = byId.get(id);
    if (preset) primary.push(preset);
  }

  if (primary.length < 3) {
    const targetMaintenance = analysis.maintenanceFit;
    const preferredVibes =
      analysis.hairTexture === "curly" || analysis.hairTexture === "coily"
        ? ["natural", "bold"]
        : analysis.hairTexture === "straight"
        ? ["sleek", "business", "soft"]
        : ["soft", "natural", "casual"];

    for (const preset of v1Presets) {
      if (primary.includes(preset)) continue;
      if (preset.maintenanceLevel !== targetMaintenance) continue;
      if (!preset.vibe.some((v) => preferredVibes.includes(v))) continue;
      primary.push(preset);
      if (primary.length >= 3) break;
    }
  }

  if (primary.length < 3) {
    for (const preset of v1Presets) {
      if (primary.includes(preset)) continue;
      primary.push(preset);
      if (primary.length >= 3) break;
    }
  }

  return primary;
}

function getMoreWomenPresets(primary: WomenPreset[]): WomenPreset[] {
  const primaryIds = new Set(primary.map((p) => p.id));
  return WOMEN_PRESETS.filter((p) => p.phase === "v1" && !primaryIds.has(p.id));
}

export default function WomenAnalysisPage() {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const foundationAnalysis = useMemo(() => createFoundationAnalysis(), []);
  const [analysis, setAnalysis] = useState<WomenAnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [apiFallbackNote, setApiFallbackNote] = useState<string | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [engineLabel, setEngineLabel] = useState<"GPT-4o" | "Qwen2-VL">(
    "GPT-4o",
  );
  const engineDisplayLabel = "Nano Banana Pro";

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(BARBER_SELFIE_STORAGE_KEY);
      if (stored && (stored.startsWith("http://") || stored.startsWith("https://"))) {
        setPreviewUrl(stored);
      } else if (stored && stored.startsWith("data:image/")) {
        setPreviewUrl(stored);
      }
      const styleId = sessionStorage.getItem(BARBER_WOMEN_STYLE_STORAGE_KEY);
      if (styleId) setSelectedStyleId(styleId);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!previewUrl) return;
    const isHttp =
      previewUrl.startsWith("http://") || previewUrl.startsWith("https://");
    const isData = previewUrl.startsWith("data:image/");
    if (!isHttp && !isData) return;

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
      engine === "alt"
        ? "/api/barber/women/analyze-alt"
        : "/api/barber/women/analyze";

    let cancelled = false;
    setAnalysisLoading(true);
    setApiFallbackNote(null);
    // Clear any previous live result while a new scan is running
    setAnalysis(null);

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: previewUrl }),
    })
      .then(
        (res) =>
          res.json() as Promise<{
            analysis?: WomenAnalysisResult;
            error?: string;
          }>,
      )
      .then((data) => {
        if (cancelled) return;
        if (data.analysis) {
          setAnalysis(data.analysis);
          setApiFallbackNote(null);
        } else {
          // Explicit fallback: use foundation analysis with a clear note
          setAnalysis(foundationAnalysis);
          setApiFallbackNote(
            "הניתוח מתבסס על הערכה ראשונית. ניתוח מלא יוצג כשהמערכת תהיה זמינה.",
          );
        }
      })
      .catch(() => {
        if (cancelled) return;
        setAnalysis(foundationAnalysis);
        setApiFallbackNote(
          "הניתוח מתבסס על הערכה ראשונית. ניתוח מלא יוצג כשהמערכת תהיה זמינה.",
        );
      })
      .finally(() => {
        if (!cancelled) setAnalysisLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [previewUrl, foundationAnalysis]);

  const effectiveAnalysis: WomenAnalysisResult =
    analysis ?? foundationAnalysis;

  const topRecommendations = useMemo(
    () => getWomenPresetRecommendations(effectiveAnalysis),
    [effectiveAnalysis]
  );
  const morePresets = useMemo(
    () => getMoreWomenPresets(topRecommendations),
    [topRecommendations]
  );

  const hasSelfie = !!previewUrl;

  const handleSelectStyle = (presetId: string) => {
    setSelectedStyleId(presetId);
    try {
      sessionStorage.setItem(BARBER_WOMEN_STYLE_STORAGE_KEY, presetId);
    } catch {
      // ignore
    }
  };

  const handleContinueToPreview = () => {
    const styleId = selectedStyleId ?? topRecommendations[0]?.id;
    if (styleId) {
      try {
        sessionStorage.setItem(BARBER_WOMEN_STYLE_STORAGE_KEY, styleId);
      } catch {
        // ignore
      }
    }
    router.push("/barber/women/preview");
  };

  return (
    <main className="min-h-screen bg-[#050509] text-white flex flex-col" dir="rtl">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <header className="flex items-start justify-between gap-4">
          <Link
            href="/barber"
            className="inline-flex items-center gap-2 rounded-xl border border-[#2A2A3A] bg-[#08080f] px-3 py-2 text-sm text-[#A8A8B3] hover:text-white hover:border-[#374151] transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>ראשי</span>
          </Link>
          <div className="flex-1 flex flex-col items-center justify-center text-center min-w-0">
            <p className="text-xs tracking-[0.22em] text-[#6B7280] mb-1">
              BarBerBe WOMEN / ANALYSIS
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold">
              ניתוח שיער חכם למסלול הנשים
            </h1>
            <p className="mt-1 text-base sm:text-base text-[#A8A8B3] max-w-xl leading-relaxed">
              זהו שכבת הבסיס לניתוח השיער לנשים: המערכת קוראת את התמונה, משערת את הטקסטורה ורמת
              התחזוקה הרצויה, ומציעה כיווני עיצוב מעשיים שנוכל להעמיק בהם בהמשך.
            </p>
            <p className="mt-1 text-[11px] sm:text-xs text-[#6B7280] text-center">
              מנוע ניתוח: {engineDisplayLabel}
            </p>
          </div>
          <div className="w-[72px] shrink-0" aria-hidden />
        </header>

        <section className="grid gap-6 grid-cols-1 lg:grid-cols-2 items-start">
          <div className="rounded-3xl border border-[#111827] bg-gradient-to-b from-[#050814] to-[#020308] p-4 sm:p-5 space-y-4">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-xs tracking-[0.22em] text-[#6B7280] mb-1">
                VISUAL INPUT / SELFIE
              </p>
              <h2 className="text-base sm:text-lg font-medium">
                הסלפי שלך למסלול השיער לנשים
              </h2>
              <p className="mt-1 text-sm sm:text-sm text-[#9CA3AF]">
                אנחנו לא שומרים את התמונה לצורכי זיהוי – רק מנתחים את מבנה השיער והטקסטורה לצורך המלצות.
              </p>
            </div>
            <div className="relative aspect-[3/4] w-full max-w-sm mx-auto overflow-hidden rounded-2xl border border-[#2A2A3A] flex items-center justify-center bg-[#050509] lg:max-h-[600px]">
              {hasSelfie ? (
                <img
                  src={previewUrl ?? ""}
                  alt="Selfie preview"
                  className="w-full h-full object-contain object-center"
                />
              ) : (
                <>
                  <img
                    src={BARBER_DEFAULT_HERO_IMAGE}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <p className="relative z-10 text-sm sm:text-sm text-[#E5E7EB]/95 text-center px-4 py-2 bg-black/50 rounded-lg max-w-[85%]">
                    לא נמצאה תמונה שמורה. חזרי למסך ההעלאה כדי להתחיל את המסלול.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[#1F2933] bg-[#03040a] p-4 sm:p-5 space-y-4 lg:sticky lg:top-8">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-xs tracking-[0.22em] text-[#6B7280] mb-1">
                PROFILE SNAPSHOT
              </p>
              <h2 className="text-base sm:text-lg font-semibold">
                סיכום ראשוני של השיער
              </h2>
            </div>

            {analysisLoading ? (
              <div className="mt-2 flex flex-col items-center justify-center rounded-2xl border border-[#111827] bg-[#050814] px-4 py-10 text-center space-y-3">
                <div className="h-10 w-10 rounded-full border border-[#2A2A3A] border-t-cyan-400/80 animate-spin" />
                <p className="text-base text-[#E5E7EB]">
                  המערכת מנתחת את מבנה השיער שלך…
                </p>
                <p className="text-sm text-[#9CA3AF]">
                  זה לוקח כמה שניות, ואז נציג כאן את סיכום הניתוח הראשוני.
                </p>
              </div>
            ) : (
              <>
                {effectiveAnalysis.personalSummaryHe && (
                  <div className="rounded-2xl bg-[#050814] border border-[#111827] p-3 text-sm sm:text-sm text-right text-[#D1D5DB] leading-relaxed">
                    {effectiveAnalysis.personalSummaryHe}
                  </div>
                )}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-right text-sm sm:text-sm">
                  <div>
                    <dt className="text-[#6B7280] mb-0.5">טקסטורת שיער מוערכת</dt>
                    <dd className="text-[#E5E7EB]">
                      {effectiveAnalysis.hairTexture === "straight" && "חלק"}
                      {effectiveAnalysis.hairTexture === "wavy" && "גלי קל"}
                      {effectiveAnalysis.hairTexture === "curly" && "מתולתל"}
                      {effectiveAnalysis.hairTexture === "coily" && "מתולתל צפוף"}
                      {effectiveAnalysis.hairTexture === "unknown" && "עדיין ללא הגדרה מדויקת"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#6B7280] mb-0.5">נטייה לפריז</dt>
                    <dd className="text-[#E5E7EB]">
                      {effectiveAnalysis.frizzLevel === "low" && "נמוכה"}
                      {effectiveAnalysis.frizzLevel === "medium" && "בינונית"}
                      {effectiveAnalysis.frizzLevel === "high" && "גבוהה"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#6B7280] mb-0.5">נפח כללי</dt>
                    <dd className="text-[#E5E7EB]">
                      {effectiveAnalysis.volumeLevel === "low" && "עדין"}
                      {effectiveAnalysis.volumeLevel === "medium" && "מאוזן"}
                      {effectiveAnalysis.volumeLevel === "high" && "מלא"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#6B7280] mb-0.5">תחושת יובש</dt>
                    <dd className="text-[#E5E7EB]">
                      {effectiveAnalysis.drynessLevel === "low" && "נמוכה"}
                      {effectiveAnalysis.drynessLevel === "medium" && "בינונית"}
                      {effectiveAnalysis.drynessLevel === "high" && "מורגשת"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#6B7280] mb-0.5">התאמה לעיצוב בחום</dt>
                    <dd className="text-[#E5E7EB]">
                      {effectiveAnalysis.heatStylingFit === "low" && "מומלץ לשמור על חום מינימלי"}
                      {effectiveAnalysis.heatStylingFit === "medium" && "מתאים לשימוש מבוקר בחום"}
                      {effectiveAnalysis.heatStylingFit === "high" && "מתאים לעבודה סדירה עם פן/מחליק"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#6B7280] mb-0.5">התאמת תחזוקה יומיומית</dt>
                    <dd className="text-[#E5E7EB]">
                      {effectiveAnalysis.maintenanceFit === "low" && "עדיפות לפתרונות כמעט ללא השקעה יומיומית"}
                      {effectiveAnalysis.maintenanceFit === "medium" && "איזון בין מראה מסודר לזמן סביר"}
                      {effectiveAnalysis.maintenanceFit === "high" && "פתוחה להשקעה בזמן ומוצרים לתוצאה מדויקת"}
                    </dd>
                  </div>
                </dl>

                {apiFallbackNote && (
                  <p className="mt-2 text-sm text-[#6B7280] text-right">
                    {apiFallbackNote}
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-xs tracking-[0.22em] text-[#6B7280] mb-1">
              PRIMARY STYLE DIRECTIONS
            </p>
            <h2 className="text-lg sm:text-xl font-semibold">
              כיווני העיצוב המומלצים לשיער שלך
            </h2>
            <p className="mt-1 text-sm sm:text-sm text-[#9CA3AF] max-w-2xl leading-relaxed">
              אלו כיוונים מעשיים שאפשר לפתח בהמשך להדמיות, שגרת מוצרים והסברים טכניים – כבר עכשיו הם
              נותנים שפה משותפת בינך לבין הספר/ית.
            </p>
          </div>

          {analysisLoading ? (
            <div className="rounded-3xl border border-[#111827] bg-[#050814] px-4 py-10 text-center flex flex-col items-center justify-center space-y-3">
              <div className="h-9 w-9 rounded-full border border-[#2A2A3A] border-t-cyan-400/80 animate-spin" />
              <p className="text-base text-[#E5E7EB]">
                מכינה עבורך כיווני עיצוב ראשוניים לפי התמונה.
              </p>
              <p className="text-sm text-[#9CA3AF]">
                אחרי הסריקה יוצגו כאן הכיוונים המומלצים לשיער שלך.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
              {topRecommendations.map((preset) => {
                const isSelected = selectedStyleId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectStyle(preset.id)}
                    className={`w-full max-w-sm rounded-3xl border p-4 flex flex-col justify-between text-center transition-colors ${
                      isSelected
                        ? "border-cyan-500/40 bg-cyan-500/5"
                        : "border-[#1F2933] bg-[#050814] hover:border-[#4B5563]"
                    }`}
                  >
                    <div className="space-y-2">
                      <h3 className="text-sm sm:text-base font-semibold text-[#F9FAFB]">
                        {preset.displayNameHe}
                      </h3>
                      <p className="text-sm text-[#6B7280]">
                        {preset.maintenanceLevel === "low" && "תחזוקה נמוכה"}
                        {preset.maintenanceLevel === "medium" && "תחזוקה בינונית"}
                        {preset.maintenanceLevel === "high" && "תחזוקה גבוהה"}
                        {" · "}
                        {preset.vibe.includes("natural") && "טבעי"}
                        {!preset.vibe.includes("natural") && preset.vibe.includes("sleek") && "חלק ומדויק"}
                        {!preset.vibe.includes("natural") &&
                          !preset.vibe.includes("sleek") &&
                          "סטייל"}
                      </p>
                      <p className="text-sm sm:text-sm text-[#D1D5DB] leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#111827]">
                      <p className="text-sm text-[#9CA3AF] leading-relaxed">
                        {preset.resultUserText}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-xs tracking-[0.22em] text-[#4B5563] mb-1">
              כיווני עיצוב
            </p>
            <h2 className="text-sm sm:text-base font-medium text-[#E5E7EB]">
              כל כיווני העיצוב
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {WOMEN_PRESETS.map((preset) => {
              const isSelected = selectedStyleId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectStyle(preset.id)}
                  className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs sm:text-sm transition-colors ${
                    isSelected
                      ? "border-cyan-500/40 bg-cyan-500/10 text-white"
                      : "border-[#1F2933] bg-[#050814] text-[#D1D5DB] hover:border-[#4B5563]"
                  }`}
                >
                  {preset.displayNameHe}
                </button>
              );
            })}
          </div>
        </section>

        <section className="pt-2 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/barber")}
            className="inline-flex items-center justify-center rounded-xl border border-transparent bg-transparent px-4 py-2.5 text-sm text-[#A8A8B3] hover:text-white transition-colors"
          >
            חזרה למסך ההעלאה
          </button>
          <button
            type="button"
            onClick={handleContinueToPreview}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-l from-cyan-400 via-cyan-500 to-blue-500 text-black font-semibold px-4 py-2.5 text-sm shadow-[0_0_20px_rgba(34,211,238,0.12)] hover:brightness-[1.03] hover:shadow-[0_0_24px_rgba(34,211,238,0.16)] transition-all duration-200"
          >
            המשך למסך התוצאה
          </button>
        </section>
      </div>
    </main>
  );
}


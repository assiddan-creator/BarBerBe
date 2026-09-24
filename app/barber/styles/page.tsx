"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SkinBackdrop } from "@/components/barber/SkinBackdrop";
import { getConfiguredBarberSkin } from "@/lib/barber-skins";
import {
  BEARD_PRESETS,
  HAIRSTYLE_PRESETS,
  type BarberPreset,
} from "@/lib/barber-presets";
import { WOMEN_PRESETS, type WomenPreset } from "@/lib/women-presets";
import type { BarberAnalysisResult } from "@/lib/barber-analysis";
import type { WomenAnalysisResult } from "@/lib/women-analysis";
import {
  BARBER_BEARD_STORAGE_KEY,
  BARBER_FLOW_STORAGE_KEY,
  BARBER_HAIRSTYLE_STORAGE_KEY,
  BARBER_SELFIE_STORAGE_KEY,
  BARBER_STYLE_STORAGE_KEY,
  BARBER_USER_MODE_STORAGE_KEY,
  BARBER_WOMEN_STYLE_STORAGE_KEY,
} from "@/lib/barber-session";

type Flow = "men" | "women";
type UserMode = "personal" | "barber";

function maintenanceLabel(level: string) {
  if (level === "very-low" || level === "low") return "קל לתחזוקה";
  if (level === "high") return "דורש קצת השקעה";
  return "תחזוקה בינונית";
}

function BarberCard({
  preset,
  selected,
  recommended,
  onClick,
}: {
  preset: BarberPreset;
  selected: boolean;
  recommended?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl border p-4 text-right transition ${
        selected
          ? "border-[var(--skin-accent)] bg-[#ff754c]/12 shadow-[0_0_0_1px_rgba(255,117,76,0.18)]"
          : "border-white/10 bg-white/[0.035] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.055]"
      }`}
    >
      {recommended && (
        <span className="absolute left-3 top-3 rounded-full bg-[#5cd1b6]/14 px-2 py-1 text-[10px] font-bold text-[var(--skin-accent-alt)]">
          הצעה חכמה
        </span>
      )}
      <p className="pr-0 text-base font-black text-white">
        {preset.displayNameHe ?? preset.nameHe}
      </p>
      <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/48">
        {preset.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/42">
        <span className="rounded-full border border-white/8 px-2.5 py-1">
          {maintenanceLabel(preset.maintenanceLevel)}
        </span>
        <span className="rounded-full border border-white/8 px-2.5 py-1">
          {preset.vibe}
        </span>
      </div>
    </button>
  );
}

function WomenCard({
  preset,
  selected,
  recommended,
  onClick,
}: {
  preset: WomenPreset;
  selected: boolean;
  recommended?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl border p-4 text-right transition ${
        selected
          ? "border-[var(--skin-accent-alt)] bg-[#5cd1b6]/10 shadow-[0_0_0_1px_rgba(92,209,182,0.16)]"
          : "border-white/10 bg-white/[0.035] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.055]"
      }`}
    >
      {recommended && (
        <span className="absolute left-3 top-3 rounded-full bg-[#ff754c]/12 px-2 py-1 text-[10px] font-bold text-[var(--skin-accent)]">
          הצעה חכמה
        </span>
      )}
      <p className="text-base font-black text-white">{preset.displayNameHe}</p>
      <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/48">
        {preset.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/42">
        <span className="rounded-full border border-white/8 px-2.5 py-1">
          {maintenanceLabel(preset.maintenanceLevel)}
        </span>
        <span className="rounded-full border border-white/8 px-2.5 py-1">
          {preset.vibe.slice(0, 2).join(" · ")}
        </span>
      </div>
    </button>
  );
}

export default function BarberStylesPage() {
  const router = useRouter();
  const skin = getConfiguredBarberSkin();
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [flow, setFlow] = useState<Flow>("men");
  const [userMode, setUserMode] = useState<UserMode>("personal");
  const [selectedHair, setSelectedHair] = useState<string | null>(null);
  const [selectedBeard, setSelectedBeard] = useState<string | null>(null);
  const [selectedWomenStyle, setSelectedWomenStyle] = useState<string | null>(null);
  const [menAnalysis, setMenAnalysis] = useState<BarberAnalysisResult | null>(null);
  const [womenAnalysis, setWomenAnalysis] = useState<WomenAnalysisResult | null>(null);
  const [smartStatus, setSmartStatus] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    try {
      const storedSelfie = sessionStorage.getItem(BARBER_SELFIE_STORAGE_KEY);
      const storedFlow = sessionStorage.getItem(BARBER_FLOW_STORAGE_KEY);
      const storedMode = sessionStorage.getItem(BARBER_USER_MODE_STORAGE_KEY);
      const storedHair = sessionStorage.getItem(BARBER_HAIRSTYLE_STORAGE_KEY);
      const storedBeard = sessionStorage.getItem(BARBER_BEARD_STORAGE_KEY);
      const storedWomen = sessionStorage.getItem(BARBER_WOMEN_STYLE_STORAGE_KEY);

      setSelfieUrl(storedSelfie);
      if (storedFlow === "men" || storedFlow === "women") setFlow(storedFlow);
      if (storedMode === "barber" || storedMode === "personal") setUserMode(storedMode);
      setSelectedHair(storedHair);
      setSelectedBeard(storedBeard);
      setSelectedWomenStyle(storedWomen);
    } catch {
      // Session persistence is optional.
    }
  }, []);

  useEffect(() => {
    if (!selfieUrl) return;

    let cancelled = false;
    setSmartStatus("loading");

    const endpoint =
      flow === "men" ? "/api/barber/analyze-alt" : "/api/barber/women/analyze-alt";

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: selfieUrl }),
    })
      .then((res) => res.json().catch(() => null))
      .then((data) => {
        if (cancelled) return;
        if (flow === "men" && data?.analysis) {
          setMenAnalysis(data.analysis as BarberAnalysisResult);
          setSmartStatus("ready");
        } else if (flow === "women" && data?.analysis) {
          setWomenAnalysis(data.analysis as WomenAnalysisResult);
          setSmartStatus("ready");
        } else {
          setSmartStatus("fallback");
        }
      })
      .catch(() => {
        if (!cancelled) setSmartStatus("fallback");
      });

    return () => {
      cancelled = true;
    };
  }, [flow, selfieUrl]);

  const recommendedHairIds = useMemo(
    () => new Set(menAnalysis?.topRecommendedHairstyles ?? []),
    [menAnalysis],
  );
  const recommendedBeardIds = useMemo(
    () => new Set(menAnalysis?.topRecommendedBeards ?? []),
    [menAnalysis],
  );
  const recommendedWomenIds = useMemo(
    () => new Set(womenAnalysis?.topRecommendedStyles ?? []),
    [womenAnalysis],
  );

  const orderedHair = useMemo(() => {
    const recommended = HAIRSTYLE_PRESETS.filter((p) => recommendedHairIds.has(p.id));
    const rest = HAIRSTYLE_PRESETS.filter((p) => !recommendedHairIds.has(p.id));
    return [...recommended, ...rest];
  }, [recommendedHairIds]);

  const orderedBeards = useMemo(() => {
    const recommended = BEARD_PRESETS.filter((p) => recommendedBeardIds.has(p.id));
    const rest = BEARD_PRESETS.filter((p) => !recommendedBeardIds.has(p.id));
    return [...recommended, ...rest];
  }, [recommendedBeardIds]);

  const orderedWomen = useMemo(() => {
    const v1 = WOMEN_PRESETS.filter((p) => p.phase === "v1");
    const recommended = v1.filter((p) => recommendedWomenIds.has(p.id));
    const rest = v1.filter((p) => !recommendedWomenIds.has(p.id));
    return [...recommended, ...rest];
  }, [recommendedWomenIds]);

  const saveMenSelection = (hairId: string | null, beardId: string | null) => {
    setSelectedHair(hairId);
    setSelectedBeard(beardId);
    try {
      if (hairId) sessionStorage.setItem(BARBER_HAIRSTYLE_STORAGE_KEY, hairId);
      else sessionStorage.removeItem(BARBER_HAIRSTYLE_STORAGE_KEY);

      if (beardId) sessionStorage.setItem(BARBER_BEARD_STORAGE_KEY, beardId);
      else sessionStorage.removeItem(BARBER_BEARD_STORAGE_KEY);

      const hair = hairId ? HAIRSTYLE_PRESETS.find((p) => p.id === hairId) : null;
      const beard = beardId ? BEARD_PRESETS.find((p) => p.id === beardId) : null;
      const label = [hair?.nameHe, beard?.nameHe].filter(Boolean).join(" · ");
      if (label) sessionStorage.setItem(BARBER_STYLE_STORAGE_KEY, label);
      else sessionStorage.removeItem(BARBER_STYLE_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  };

  const chooseWomenStyle = (id: string) => {
    setSelectedWomenStyle(id);
    try {
      sessionStorage.setItem(BARBER_WOMEN_STYLE_STORAGE_KEY, id);
    } catch {
      // ignore storage errors
    }
  };

  const continueToPreview = () => {
    if (flow === "women") {
      if (!selectedWomenStyle) return;
      router.push("/barber/result");
      return;
    }

    if (!selectedHair && !selectedBeard) return;
    router.push("/barber/result");
  };

  const canContinue =
    flow === "women"
      ? Boolean(selectedWomenStyle)
      : Boolean(selectedHair || selectedBeard);

  if (!selfieUrl) {
    return (
      <main dir="rtl" className="min-h-screen bg-[var(--skin-bg)] px-5 text-[var(--skin-text)]">
        <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center text-center">
          <p className="text-3xl font-black">צריך תמונה כדי להתחיל.</p>
          <button
            type="button"
            onClick={() => router.push("/barber")}
            className="mt-6 rounded-2xl bg-[#f7f3eb] px-5 py-3 font-bold text-[#151518]"
          >
            חזרה להעלאת תמונה
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[var(--skin-bg)] text-[var(--skin-text)]"
    >
      <SkinBackdrop media={skin.media.styles} className="fixed" />
      <div className="relative mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 border-b border-white/8 pb-5">
          <button
            type="button"
            onClick={() => router.push("/barber")}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:text-white"
          >
            חזרה
          </button>
          <div className="text-center">
            <p className="text-lg font-black">{skin.brand.name}</p>
            <p className="text-xs text-white/38">
              {userMode === "barber" ? "ייעוץ מול הלקוח" : "בחר את הלוק הבא"}
            </p>
          </div>
          <div className="w-[68px]" />
        </header>

        <div className="grid gap-8 py-8 lg:grid-cols-[320px_1fr] lg:gap-10">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#17171b]">
              <div className="aspect-[4/5]">
                <img
                  src={selfieUrl}
                  alt="התמונה שנבחרה"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="border-t border-white/8 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">הבסיס נשאר אותו אדם.</p>
                    <p className="mt-1 text-xs leading-5 text-white/42">
                      בהדמיה נשנה רק את השיער או הזקן שבחרת.
                    </p>
                  </div>
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      smartStatus === "loading"
                        ? "animate-pulse bg-[#ffb49d]"
                        : smartStatus === "ready"
                          ? "bg-[#5cd1b6]"
                          : "bg-white/25"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.025] p-4 text-sm text-white/48">
              {smartStatus === "loading" && "בודק ברקע אילו כיוונים יכולים להיות מעניינים…"}
              {smartStatus === "ready" && "סימנתי כמה כיוונים שכדאי להתחיל מהם. הבחירה עדיין שלך."}
              {smartStatus === "fallback" && "אפשר לבחור חופשי. ההדמיה עצמה ממשיכה לעבוד כרגיל."}
            </div>
          </aside>

          <section className="min-w-0">
            {flow === "men" ? (
              <div className="space-y-10">
                <div>
                  <div className="mb-4">
                    <p className="text-sm font-bold text-[var(--skin-accent)]">שלב 1</p>
                    <h1 className="mt-1 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                      בחר תספורת
                    </h1>
                    <p className="mt-2 text-white/48">אפשר להתחיל מההצעות ולשנות כמה שרוצים.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {orderedHair.map((preset) => (
                      <BarberCard
                        key={preset.id}
                        preset={preset}
                        recommended={recommendedHairIds.has(preset.id)}
                        selected={selectedHair === preset.id}
                        onClick={() => saveMenSelection(preset.id, selectedBeard)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[var(--skin-accent-alt)]">שלב 2 · אופציונלי</p>
                      <h2 className="mt-1 text-2xl font-black tracking-[-0.025em] sm:text-3xl">
                        רוצה גם זקן?
                      </h2>
                    </div>
                    {selectedBeard && (
                      <button
                        type="button"
                        onClick={() => saveMenSelection(selectedHair, null)}
                        className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/55 hover:text-white"
                      >
                        בלי זקן
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {orderedBeards.map((preset) => (
                      <BarberCard
                        key={preset.id}
                        preset={preset}
                        recommended={recommendedBeardIds.has(preset.id)}
                        selected={selectedBeard === preset.id}
                        onClick={() => saveMenSelection(selectedHair, preset.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-5">
                  <p className="text-sm font-bold text-[var(--skin-accent-alt)]">בחר כיוון</p>
                  <h1 className="mt-1 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                    איזה שיער בא לך לראות?
                  </h1>
                  <p className="mt-2 max-w-2xl text-white/48">
                    בחר לוק אחד להתחלה. אחר כך אפשר לחזור ולנסות עוד.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {orderedWomen.map((preset) => (
                    <WomenCard
                      key={preset.id}
                      preset={preset}
                      recommended={recommendedWomenIds.has(preset.id)}
                      selected={selectedWomenStyle === preset.id}
                      onClick={() => chooseWomenStyle(preset.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="sticky bottom-4 z-20 mt-8 rounded-2xl border border-white/10 bg-[#151518]/94 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur">
              <button
                type="button"
                disabled={!canContinue}
                onClick={continueToPreview}
                className="w-full rounded-xl bg-[#f7f3eb] px-5 py-4 font-black text-[#151518] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                {canContinue
                  ? userMode === "barber"
                    ? "הצג ללקוח את ההדמיה"
                    : "תראו לי איך זה נראה"
                  : "בחר לוק כדי להמשיך"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { SkinBackdrop } from "@/components/barber/SkinBackdrop";
import { getConfiguredBarberSkin } from "@/lib/barber-skins";
import {
  BEARD_PRESETS,
  HAIRSTYLE_PRESETS,
  type BarberPreset,
} from "@/lib/barber-presets";
import { WOMEN_PRESETS, type WomenPreset } from "@/lib/women-presets";
import {
  BARBER_BEARD_STORAGE_KEY,
  BARBER_FLOW_STORAGE_KEY,
  BARBER_HAIRSTYLE_STORAGE_KEY,
  BARBER_SELFIE_PUBLIC_ID_STORAGE_KEY,
  BARBER_SELFIE_STORAGE_KEY,
  BARBER_USER_MODE_STORAGE_KEY,
  BARBER_WOMEN_STYLE_STORAGE_KEY,
  appendBarberResultHistory,
  clearBarberWorkingSession,
  readBarberResultHistory,
  type BarberResultHistoryItem,
} from "@/lib/barber-session";

type Flow = "men" | "women";
type UserMode = "personal" | "barber";
type ViewMode = "after" | "before" | "compare";

function BarberSelection({
  hair,
  beard,
}: {
  hair: BarberPreset | null;
  beard: BarberPreset | null;
}) {
  return (
    <div className="space-y-3">
      {hair && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <p className="text-xs font-bold text-[var(--skin-accent)]">תספורת</p>
          <p className="mt-1 text-lg font-black">{hair.displayNameHe ?? hair.nameHe}</p>
          <p className="mt-1 text-sm leading-6 text-white/48">{hair.resultUserText ?? hair.description}</p>
        </div>
      )}
      {beard && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <p className="text-xs font-bold text-[var(--skin-accent-alt)]">זקן</p>
          <p className="mt-1 text-lg font-black">{beard.displayNameHe ?? beard.nameHe}</p>
          <p className="mt-1 text-sm leading-6 text-white/48">{beard.resultUserText ?? beard.description}</p>
        </div>
      )}
    </div>
  );
}

export default function BarberResultPage() {
  const router = useRouter();
  const skin = getConfiguredBarberSkin();
  const startedRef = useRef(false);

  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [flow, setFlow] = useState<Flow>("men");
  const [userMode, setUserMode] = useState<UserMode>("personal");
  const [hairId, setHairId] = useState<string | null>(null);
  const [beardId, setBeardId] = useState<string | null>(null);
  const [womenStyleId, setWomenStyleId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("after");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<BarberResultHistoryItem[]>([]);

  useEffect(() => {
    try {
      const storedSelfie = sessionStorage.getItem(BARBER_SELFIE_STORAGE_KEY);
      const storedFlow = sessionStorage.getItem(BARBER_FLOW_STORAGE_KEY);
      const storedMode = sessionStorage.getItem(BARBER_USER_MODE_STORAGE_KEY);

      setSelfieUrl(storedSelfie);
      if (storedFlow === "men" || storedFlow === "women") setFlow(storedFlow);
      if (storedMode === "personal" || storedMode === "barber") setUserMode(storedMode);

      setHairId(sessionStorage.getItem(BARBER_HAIRSTYLE_STORAGE_KEY));
      setBeardId(sessionStorage.getItem(BARBER_BEARD_STORAGE_KEY));
      setWomenStyleId(sessionStorage.getItem(BARBER_WOMEN_STYLE_STORAGE_KEY));
      setHistory(readBarberResultHistory());
    } catch {
      // Session persistence is optional.
    } finally {
      setHydrated(true);
    }
  }, []);

  const hairPreset = useMemo(
    () => HAIRSTYLE_PRESETS.find((p) => p.id === hairId) ?? null,
    [hairId],
  );
  const beardPreset = useMemo(
    () => BEARD_PRESETS.find((p) => p.id === beardId) ?? null,
    [beardId],
  );
  const womenPreset = useMemo(
    () => WOMEN_PRESETS.find((p) => p.id === womenStyleId) ?? null,
    [womenStyleId],
  );

  const canGenerate =
    Boolean(selfieUrl) &&
    (flow === "women" ? Boolean(womenPreset) : Boolean(hairPreset || beardPreset));

  const getSelectionTitle = () =>
    flow === "women"
      ? womenPreset?.displayNameHe ?? womenPreset?.nameHe ?? "לוק שיער"
      : [
          hairPreset?.displayNameHe ?? hairPreset?.nameHe,
          beardPreset?.displayNameHe ?? beardPreset?.nameHe,
        ]
          .filter(Boolean)
          .join(" + ") || "לוק חדש";

  const buildMenPrompt = () => {
    if (hairPreset && beardPreset) {
      return `Apply this hairstyle: ${hairPreset.aiPrompt}. Apply this beard style: ${beardPreset.aiPrompt}. The final result is one natural, photorealistic salon portrait with both changes integrated realistically.`;
    }
    if (hairPreset) return hairPreset.aiPrompt;
    if (beardPreset) return beardPreset.aiPrompt;
    return "";
  };

  const generate = async () => {
    if (!selfieUrl || !canGenerate || isGenerating) return;

    setIsGenerating(true);
    setGeneratedUrl(null);
    setError(null);
    setViewMode("after");

    try {
      const response =
        flow === "women"
          ? await fetch("/api/barber/women/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: selfieUrl,
                styleId: womenPreset?.id,
              }),
            })
          : await fetch("/api/barber/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: selfieUrl,
                prompt: buildMenPrompt(),
                type:
                  hairPreset && beardPreset
                    ? "combo"
                    : hairPreset
                      ? "hairstyle"
                      : "beard",
                model: "google/nano-banana-2",
              }),
            });

      const data = (await response.json().catch(() => null)) as
        | { imageUrl?: string; publicId?: string; error?: string }
        | null;

      if (!response.ok || !data?.imageUrl) {
        throw new Error(data?.error || "generation_failed");
      }

      setGeneratedUrl(data.imageUrl);

      const historyItem: BarberResultHistoryItem = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: Date.now(),
        imageUrl: data.imageUrl,
        ...(data.publicId ? { publicId: data.publicId } : {}),
        sourceImageUrl: selfieUrl,
        title: getSelectionTitle(),
        flow,
        ...(hairPreset?.id ? { hairId: hairPreset.id } : {}),
        ...(beardPreset?.id ? { beardId: beardPreset.id } : {}),
        ...(womenPreset?.id ? { womenStyleId: womenPreset.id } : {}),
      };

      const previousHistory = readBarberResultHistory();
      const nextHistory = appendBarberResultHistory(historyItem);
      setHistory(nextHistory);

      const retainedIds = new Set(
        nextHistory.map((item) => item.publicId).filter(Boolean),
      );
      for (const oldItem of previousHistory) {
        if (oldItem.publicId && !retainedIds.has(oldItem.publicId)) {
          void cleanupAsset(oldItem.publicId);
        }
      }
    } catch {
      setError("לא הצלחנו להכין את ההדמיה הפעם. אפשר לנסות שוב בלי לאבד את הבחירה.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!hydrated || !canGenerate || startedRef.current) return;
    startedRef.current = true;
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, canGenerate]);

  const downloadImage = async () => {
    if (!generatedUrl) return;
    try {
      const response = await fetch(generatedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `barberbe-${Date.now()}.jpg`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(generatedUrl, "_blank");
    }
  };

  const cleanupAsset = async (publicId?: string | null) => {
    if (!publicId) return;
    try {
      await fetch("/api/barber/selfie-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
    } catch {
      // Cleanup is best-effort and should never block the user.
    }
  };

  const resetCurrentSession = async () => {
    let selfiePublicId: string | null = null;
    try {
      selfiePublicId = sessionStorage.getItem(
        BARBER_SELFIE_PUBLIC_ID_STORAGE_KEY,
      );
    } catch {
      // ignore storage errors
    }

    const ids = new Set(
      [selfiePublicId, ...history.map((item) => item.publicId)].filter(
        (value): value is string => Boolean(value),
      ),
    );

    for (const publicId of ids) {
      void cleanupAsset(publicId);
    }

    clearBarberWorkingSession();
    setHistory([]);
    router.push("/barber");
  };

  const shareImage = async () => {
    if (!generatedUrl) return;

    try {
      const response = await fetch(generatedUrl);
      const blob = await response.blob();
      const file = new File([blob], "barberbe-look.jpg", {
        type: blob.type || "image/jpeg",
      });

      if (
        navigator.share &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          title: "BarBerBe",
          text: "הלוק שבדקתי ב-BarBerBe",
          files: [file],
        });
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: "BarBerBe",
          text: "הלוק שבדקתי ב-BarBerBe",
          url: generatedUrl,
        });
        return;
      }
    } catch {
      // Fall through to download if native sharing fails or is cancelled.
    }

    await downloadImage();
  };

  if (!hydrated) {
    return (
      <main dir="rtl" className="min-h-screen bg-[var(--skin-bg)] text-[var(--skin-text)]">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-white/45">מכין את הלוק…</p>
        </div>
      </main>
    );
  }

  if (!canGenerate || !selfieUrl) {
    return (
      <main dir="rtl" className="min-h-screen bg-[var(--skin-bg)] px-5 text-[var(--skin-text)]">
        <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center text-center">
          <p className="text-3xl font-black">חסר לנו לוק או תמונה.</p>
          <button
            type="button"
            onClick={() => router.push("/barber/styles")}
            className="mt-6 rounded-2xl bg-[#f7f3eb] px-5 py-3 font-bold text-[#151518]"
          >
            חזרה לבחירת לוק
          </button>
        </div>
      </main>
    );
  }

  const selectedTitle = getSelectionTitle();

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-[var(--skin-bg)] text-[var(--skin-text)]">
      <SkinBackdrop media={skin.media.result} className="fixed" />
      <div className="relative mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 border-b border-white/8 pb-5">
          <button
            type="button"
            onClick={() => router.push("/barber/styles")}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:text-white"
          >
            החלף לוק
          </button>
          <div className="text-center">
            <p className="text-lg font-black">{skin.brand.name}</p>
            <p className="text-xs text-white/38">
              {userMode === "barber" ? "תצוגת לקוח" : "הלוק החדש שלך"}
            </p>
          </div>
          <div className="w-[82px]" />
        </header>

        <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-10">
          <section className="min-w-0">
            <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#17171b] shadow-[0_30px_90px_rgba(0,0,0,0.32)]">
              {generatedUrl && !isGenerating && (
                <div className="flex justify-center border-b border-white/8 p-3">
                  <div className="flex rounded-full border border-white/10 bg-black/20 p-1 text-sm">
                    {(["after", "before", "compare"] as ViewMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setViewMode(mode)}
                        className={`rounded-full px-4 py-2 transition ${
                          viewMode === mode
                            ? "bg-[var(--skin-text)] text-[var(--skin-bg)]"
                            : "text-white/48 hover:text-white"
                        }`}
                      >
                        {mode === "after" ? "אחרי" : mode === "before" ? "לפני" : "השוואה"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative min-h-[520px] bg-[#111114] sm:min-h-[620px]">
                {isGenerating ? (
                  <div className="absolute inset-0">
                    <img
                      src={selfieUrl}
                      alt="התמונה המקורית"
                      className="h-full w-full object-contain opacity-55"
                    />
                    <SkinBackdrop media={skin.media.generating} />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
                      <div className="max-w-sm px-6 text-center">
                        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-white/15 border-t-[#ff754c]" />
                        <p className="text-xl font-black">מכינים את הלוק…</p>
                        <p className="mt-2 text-sm leading-6 text-white/48">
                          שומרים על האדם שבתמונה ומשנים רק את מה שבחרת.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : generatedUrl ? (
                  viewMode === "compare" ? (
                    <div className="grid h-full min-h-[520px] grid-cols-2 sm:min-h-[620px]">
                      <div className="relative border-l border-white/8">
                        <img src={selfieUrl} alt="לפני" className="h-full w-full object-contain" />
                        <span className="absolute right-3 top-3 rounded-full bg-black/65 px-3 py-1 text-xs">לפני</span>
                      </div>
                      <div className="relative">
                        <img src={generatedUrl} alt="אחרי" className="h-full w-full object-contain" />
                        <span className="absolute right-3 top-3 rounded-full bg-[var(--skin-accent)] px-3 py-1 text-xs font-bold">אחרי</span>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={viewMode === "before" ? selfieUrl : generatedUrl}
                      alt={viewMode === "before" ? "לפני" : "אחרי"}
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                  )
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white/45">מוכן לניסיון נוסף.</p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
                <p className="text-sm text-red-100">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    startedRef.current = false;
                    void generate();
                  }}
                  className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#151518]"
                >
                  נסה שוב
                </button>
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[1.6rem] border border-white/10 bg-[#17171b] p-5 sm:p-6">
              <p className="text-xs font-bold text-[var(--skin-accent)]">
                {userMode === "barber" ? "לוק לייעוץ" : "בחרת"}
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-[-0.03em]">
                {selectedTitle}
              </h1>
              <p className="mt-2 text-sm leading-6 text-white/45">
                {userMode === "barber"
                  ? "ההדמיה היא כלי שיחה לפני התספורת. אפשר לחזור, לשנות כיוון ולהשוות."
                  : "אם זה לא זה, מחליפים לוק ומנסים שוב. בלי התחייבות ובלי לנחש."}
              </p>
            </div>

            {flow === "men" ? (
              <>
                <BarberSelection hair={hairPreset} beard={beardPreset} />
                {userMode === "barber" && (
                  <div className="rounded-2xl border border-[var(--skin-accent-alt)]/20 bg-[#5cd1b6]/7 p-5">
                    <p className="text-sm font-black text-[var(--skin-accent-alt)]">פתק מקצועי</p>
                    {hairPreset?.resultBarberSummary && (
                      <p className="mt-2 text-sm leading-6 text-white/64">
                        {hairPreset.resultBarberSummary}
                      </p>
                    )}
                    {beardPreset?.resultBarberSummary && (
                      <p className="mt-2 text-sm leading-6 text-white/64">
                        {beardPreset.resultBarberSummary}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : womenPreset ? (
              <>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-sm leading-6 text-white/58">{womenPreset.resultUserText}</p>
                </div>
                {userMode === "barber" && (
                  <div className="rounded-2xl border border-[var(--skin-accent-alt)]/20 bg-[#5cd1b6]/7 p-5">
                    <p className="text-sm font-black text-[var(--skin-accent-alt)]">פתק מקצועי</p>
                    <p className="mt-2 text-sm leading-6 text-white/64">
                      {womenPreset.resultStylistSummary}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-white/42">
                      {womenPreset.resultTechnicalNotes}
                    </p>
                  </div>
                )}
              </>
            ) : null}

            {generatedUrl && userMode === "barber" && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-white p-2">
                    <QRCodeSVG
                      value={generatedUrl}
                      size={104}
                      marginSize={0}
                    />
                  </div>
                  <div>
                    <p className="font-bold">שלח ללקוח</p>
                    <p className="mt-1 text-sm leading-5 text-white/45">
                      סריקה אחת והתוצאה נפתחת ישר בטלפון.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {generatedUrl && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={downloadImage}
                  className="rounded-2xl bg-[#f7f3eb] px-4 py-3 font-black text-[#151518] transition hover:bg-white"
                >
                  הורדה
                </button>
                <button
                  type="button"
                  onClick={shareImage}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 font-bold transition hover:bg-white/[0.07]"
                >
                  שיתוף
                </button>
              </div>
            )}

            {history.length > 1 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold">
                    {userMode === "barber" ? "הלוקים של הלקוח" : "הלוקים שניסית"}
                  </p>
                  <span className="text-xs text-white/38">
                    {history.length} תוצאות
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {history.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setGeneratedUrl(item.imageUrl);
                        setFlow(item.flow);
                        setHairId(item.hairId ?? null);
                        setBeardId(item.beardId ?? null);
                        setWomenStyleId(item.womenStyleId ?? null);
                        setViewMode("after");
                      }}
                      className="overflow-hidden rounded-xl border border-white/10 bg-black/20"
                      title={item.title}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="aspect-square h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {generatedUrl && (
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => void generate()}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm font-bold text-white/72 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                גרסה נוספת לאותו לוק
              </button>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/barber/styles")}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white/72 hover:text-white"
              >
                נסה לוק אחר
              </button>
              <button
                type="button"
                onClick={resetCurrentSession}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white/72 hover:text-white"
              >
                {userMode === "barber" ? "לקוח חדש" : "תמונה חדשה"}
              </button>
            </div>

            <p className="pt-1 text-center text-[11px] text-white/28">
              ההדמיה נוצרת באמצעות Nano Banana 2
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

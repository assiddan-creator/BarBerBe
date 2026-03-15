"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";

function ScanningDots() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 400);
    return () => clearInterval(id);
  }, []);
  return <span className="inline-block min-w-[1.2em] text-left">{".".repeat(dots)}</span>;
}
import { useRouter } from "next/navigation";
import {
  BARBER_SELFIE_STORAGE_KEY,
  BARBER_STYLE_STORAGE_KEY,
  BARBER_FLOW_STORAGE_KEY,
  BARBER_DEFAULT_HERO_IMAGE,
  BARBER_ANALYSIS_ENGINE_STORAGE_KEY,
} from "@/lib/barber-session";

export default function BarberPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hostedSelfieUrl, setHostedSelfieUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<"men" | "women" | null>(
    null,
  );
  const [selectedEngine, setSelectedEngine] = useState<"live" | "alt">("live");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasPreview = Boolean(previewUrl);
  const hasHostedImage = Boolean(hostedSelfieUrl);
  const router = useRouter();

  const handleOpenFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const uploadSelfie = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/barber/selfie-upload", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Upload failed");
      }

      setHostedSelfieUrl(data.url);
      try {
        sessionStorage.setItem(BARBER_SELFIE_STORAGE_KEY, data.url);
        sessionStorage.removeItem(BARBER_STYLE_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
      // Auto-detect gender and set flow so user doesn't need to select
      fetch("/api/barber/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: data.url }),
      })
        .then((r) => r.json())
        .then((payload: { analysis?: { gender?: string } }) => {
          const gender = payload?.analysis?.gender;
          if (gender === "female") {
            try {
              sessionStorage.setItem(BARBER_FLOW_STORAGE_KEY, "women");
              setSelectedFlow("women");
              router.push("/barber/women/analysis");
            } catch {
              // ignore
            }
          } else if (gender === "male") {
            try {
              sessionStorage.setItem(BARBER_FLOW_STORAGE_KEY, "men");
              setSelectedFlow("men");
              router.push("/barber/analysis");
            } catch {
              // ignore
            }
          }
        })
        .catch(() => {});
    } catch {
      setUploadError("לא הצלחנו להעלות את התמונה. נסה שוב בעוד רגע.");
      setHostedSelfieUrl(null);
      try {
        sessionStorage.removeItem(BARBER_SELFIE_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setUploadError(null);
    setHostedSelfieUrl(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== "string") return;
      const dataUrl = reader.result;
      setPreviewUrl(dataUrl);
      // Do not write large base64 data URLs into sessionStorage; hosted URL will be stored after upload.
    };
    reader.readAsDataURL(file);

    void uploadSelfie(file);
  };

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(BARBER_SELFIE_STORAGE_KEY);
      if (stored) {
        if (stored.startsWith("http://") || stored.startsWith("https://")) {
          setHostedSelfieUrl(stored);
          setPreviewUrl(stored);
        } else if (stored.startsWith("data:")) {
          // Legacy base64 flow: keep as preview only; analysis page will handle compatibility.
          setPreviewUrl(stored);
        }
      }
      const storedFlow = sessionStorage.getItem(BARBER_FLOW_STORAGE_KEY);
      if (storedFlow === "men" || storedFlow === "women") {
        setSelectedFlow(storedFlow);
      }
      const storedEngine = sessionStorage.getItem(
        BARBER_ANALYSIS_ENGINE_STORAGE_KEY,
      );
      if (storedEngine === "live" || storedEngine === "alt") {
        setSelectedEngine(storedEngine);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handlePrimaryCta = () => {
    if (!hasHostedImage) {
      setUploadError("יש להעלות תמונה לפני שממשיכים לניתוח.");
      handleOpenFilePicker();
      return;
    }
    let flow: "men" | "women" | null = null;
    try {
      const storedFlow = sessionStorage.getItem(BARBER_FLOW_STORAGE_KEY);
      if (storedFlow === "men" || storedFlow === "women") {
        flow = storedFlow;
      }
    } catch {
      // ignore storage errors
    }
    if (flow === "women") {
      router.push("/barber/women/analysis");
    } else {
      // default: men's flow
      router.push("/barber/analysis");
    }
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#040406] text-white flex items-center justify-center px-4 py-6 sm:py-10"
    >
      <section className="w-full max-w-5xl rounded-3xl border border-[#00FFD1]/30 bg-[#0a0a0f] px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 space-y-10 animate-barber-fade-in shadow-[0_0_8px_rgba(0,255,209,0.3)]">
        <div className="relative">
          <Link
            href="/barber"
            className="absolute top-0 right-0 inline-flex items-center gap-2 rounded-xl border border-[#00FFD1]/50 bg-[#0a0a0f] px-3 py-2 text-sm text-[#00FFD1] transition-all z-10 hover:shadow-[0_0_12px_rgba(0,255,209,0.4)] hover:border-[#00FFD1]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>ראשי</span>
          </Link>
        </div>
        {/* Top branding area */}
        <header className="space-y-4 text-center animate-barber-fade-in" style={{ animationDelay: "0.05s", animationFillMode: "backwards" }}>
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#00FFD1]/40 bg-[#0a0a0f] px-3 py-1 text-xs tracking-[0.18em] text-[#00FFD1] shadow-[0_0_8px_rgba(0,255,209,0.2)]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00FFD1] animate-pulse" />
                  AI HAIR SIMULATOR
                </span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1">
                <h1 className="text-2xl sm:text-3xl tracking-[0.25em] font-semibold text-white">
                  BarBerBe
                </h1>
                <p className="text-[10px] sm:text-xs tracking-[0.22em] uppercase text-[#00FFD1]/80 whitespace-nowrap">
                  YOUR PERSONAL STYLE ADVISOR
                </p>
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-[#9CA3AF]">
                העלה סלפי אחד וקבל המלצות מותאמות לתספורת וזקן
              </p>
            </div>
          </div>
        </header>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Main content grid */}
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
          {/* Upload card — hero bg + scan line */}
          <section className="lg:col-span-2 rounded-2xl border border-[#00FFD1]/30 bg-[#0a0a0f] p-5 sm:p-6 flex flex-col gap-4 animate-barber-scale-in transition-all duration-300 shadow-[0_0_8px_rgba(0,255,209,0.2)] hover:shadow-[0_0_12px_rgba(0,255,209,0.3)]" style={{ animationDelay: "0.1s", animationFillMode: "backwards" }}>
            <div className="space-y-2 text-center">
              <h2 className="text-sm font-medium text-[#00FFD1]">
                העלאת סלפי
              </h2>
              <p className="text-sm text-[#9CA3AF]">
                תמונה חדה עם תאורה קדמית תשפר את ניתוח ה-AI
              </p>
            </div>

            <div className="mt-1 flex-1 space-y-4">
              <div
                onClick={handleOpenFilePicker}
                className="group border border-[#00FFD1]/40 rounded-2xl aspect-[4/3] flex items-center justify-center text-center cursor-pointer overflow-hidden relative shadow-[0_0_8px_rgba(0,255,209,0.25)] hover:shadow-[0_0_14px_rgba(0,255,209,0.4)] transition-all duration-300"
              >
                {/* Hero background when no preview */}
                {!hasPreview && (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-center rounded-2xl pointer-events-none"
                      style={{ backgroundImage: "url(/images/scan-bg-1.png)" }}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[#040406] via-[#040406]/70 to-[#040406]/50 pointer-events-none" />
                  </>
                )}
                {!hasPreview ? (
                  <>
                    {/* Animated scan line — always visible on upload area */}
                    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none" aria-hidden>
                      <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00FFD1] to-transparent animate-barber-scan-line shadow-[0_0_10px_rgba(0,255,209,0.6)]" style={{ animationDuration: "2s" }} />
                    </div>
                    <div className="relative z-10 flex flex-col items-center justify-center gap-3 px-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0a0a0f]/90 border border-[#00FFD1]/50 shadow-[0_0_12px_rgba(0,255,209,0.2)] group-hover:border-[#00FFD1]">
                        <span className="text-lg">📸</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-base sm:text-lg font-medium text-white">
                          העלה סלפי פרונטלי
                        </p>
                        <p className="text-xs sm:text-sm text-[#00FFD1]/90">
                          תמונה חדה עם תאורה קדמית תשפר את ניתוח ה-AI
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="relative h-full w-full bg-[#040406]">
                    <img
                      src={previewUrl ?? undefined}
                      alt="תצוגה מקדימה של הסלפי שהועלה"
                      className="h-full w-full object-contain object-center rounded-2xl"
                    />
                    {uploading && (
                      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00FFD1] to-transparent animate-barber-scan-line shadow-[0_0_10px_rgba(0,255,209,0.6)]" style={{ animationDuration: "2s" }} />
                      </div>
                    )}
                    <div className="absolute right-3 top-3 rounded-full bg-black/80 border border-[#00FFD1]/60 px-3 py-1 text-xs text-[#00FFD1] flex items-center gap-1 shadow-[0_0_6px_rgba(0,255,209,0.3)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00FFD1]" />
                      {uploading ? (
                        <span className="inline-flex items-center">
                          SCANNING<ScanningDots />
                        </span>
                      ) : (
                        "התמונה נטענה"
                      )}
                    </div>
                  </div>
                )}
              </div>

              {hasPreview && (
                <>
                  <div className="flex justify-center w-full">
                    <button
                      type="button"
                      onClick={handleOpenFilePicker}
                      className="inline-flex items-center justify-center rounded-xl border border-[#00FFD1]/50 bg-[#0a0a0f] px-4 py-2 text-sm text-[#00FFD1] transition-all hover:shadow-[0_0_10px_rgba(0,255,209,0.35)]"
                    >
                      החלף תמונה
                    </button>
                  </div>
                  <p className="text-sm text-[#9CA3AF] text-center">
                    {uploading
                      ? "מעלה את התמונה לאחסון מאובטח..."
                      : hasHostedImage
                      ? "התמונה נטענה בהצלחה. בשלב הבא נבצע ניתוח פנים AI ונציע לוקים מותאמים עבורך"
                      : "מכינים את התמונה לניתוח..."}
                  </p>
                </>
              )}
            </div>
          </section>

          {/* Analysis summary card — HUD panel */}
          <section className="rounded-2xl border border-[#00FFD1]/30 bg-[#0a0a0f] p-5 sm:p-6 flex flex-col gap-4 animate-barber-scale-in transition-all shadow-[0_0_8px_rgba(0,255,209,0.2)] hover:shadow-[0_0_12px_rgba(0,255,209,0.28)]" style={{ animationDelay: "0.15s", animationFillMode: "backwards" }}>
            <div className="text-center space-y-1">
              <h2 className="text-sm font-semibold text-[#00FFD1]">ניתוח פנים AI</h2>
              <p className="text-sm text-[#9CA3AF]">
                ניתוח ראשוני יופיע כאן לאחר העלאת סלפי
              </p>
            </div>

            <div className="mt-2 space-y-3 text-sm rounded-2xl border border-[#00FFD1]/20 bg-[#080810] px-4 py-3 shadow-[0_0_6px_rgba(0,255,209,0.15)]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#00FFD1]/80">סטטוס סלפי</span>
                <span className="text-[#00FFD1]">
                  {hasPreview ? "תמונה הועלתה" : "ממתין להעלאת סלפי"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#00FFD1]/80">מצב ניתוח</span>
                <span className="text-[#00FFD1]">
                  {hasHostedImage
                    ? "מוכן לניתוח בשלב הבא"
                    : "הניתוח יופעל לאחר העלאת תמונה"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#00FFD1]/80">השלב הבא</span>
                <span className="text-[#00FFD1]">
                  {hasHostedImage
                    ? "לחץ על ״המשך לניתוח״ כדי להפעיל את ה-AI"
                    : "העלה סלפי כדי להמשיך למסך הניתוח"}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Flow selection + actions section — HUD style */}
        <section className="space-y-3">
          {hasHostedImage && (
            <div className="space-y-2 rounded-2xl border border-[#00FFD1]/30 bg-[#0a0a0f] p-4 shadow-[0_0_8px_rgba(0,255,209,0.2)]">
              <h2 className="text-sm font-medium text-[#00FFD1] text-center">
                בחר מסלול המשך
              </h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      sessionStorage.setItem(BARBER_FLOW_STORAGE_KEY, "men");
                      setSelectedFlow("men");
                    } catch {
                      // ignore
                    }
                  }}
                  className={`flex-1 sm:flex-none sm:w-auto rounded-2xl px-4 py-2.5 text-sm sm:text-base flex flex-col items-center justify-center gap-0.5 transition-all border text-center ${
                    selectedFlow === "men"
                      ? "bg-[#00FFD1]/10 border-[#00FFD1] text-[#00FFD1] shadow-[0_0_12px_rgba(0,255,209,0.35)]"
                      : "bg-[#0a0a0f] border-[#00FFD1]/40 text-white hover:border-[#00FFD1]/70 hover:shadow-[0_0_10px_rgba(0,255,209,0.25)]"
                  }`}
                >
                  <span className="font-medium">מסלול גברים</span>
                  <span className="text-sm text-[#9CA3AF]">
                    תספורות וזקנים לגברים
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      sessionStorage.setItem(BARBER_FLOW_STORAGE_KEY, "women");
                      setSelectedFlow("women");
                    } catch {
                      // ignore
                    }
                  }}
                  className={`flex-1 sm:flex-none sm:w-auto rounded-2xl px-4 py-2.5 text-sm sm:text-base flex flex-col items-center justify-center gap-0.5 transition-all border text-center ${
                    selectedFlow === "women"
                      ? "bg-[#00FFD1]/10 border-[#00FFD1] text-[#00FFD1] shadow-[0_0_12px_rgba(0,255,209,0.35)]"
                      : "bg-[#0a0a0f] border-[#00FFD1]/40 text-white hover:border-[#00FFD1]/70 hover:shadow-[0_0_10px_rgba(0,255,209,0.25)]"
                  }`}
                >
                  <span className="font-medium">מסלול נשים</span>
                  <span className="text-sm text-[#9CA3AF]">
                    מסלול שיער לנשים
                  </span>
                </button>
              </div>
              <div className="w-full flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="w-full max-w-sm rounded-xl border border-[#00FFD1] bg-[#0a0a0f] text-[#00FFD1] font-semibold py-3.5 text-sm sm:text-base shadow-[0_0_8px_rgba(0,255,209,0.3)] transition-all hover:shadow-[0_0_16px_rgba(0,255,209,0.45)] hover:bg-[#00FFD1]/10"
                >
                  המשך לניתוח
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Upload error (if any) */}
        {uploadError && (
          <p className="text-sm text-red-400 text-right">{uploadError}</p>
        )}

        {/* Features strip */}
        <section className="grid gap-3 sm:gap-4 sm:grid-cols-3 text-center">
          <div className="rounded-2xl border border-[#00FFD1]/25 bg-[#0a0a0f] px-4 py-3 flex flex-col items-center justify-center gap-1 animate-barber-fade-in transition-all hover:shadow-[0_0_8px_rgba(0,255,209,0.25)]" style={{ animationDelay: "0.2s", animationFillMode: "backwards" }}>
            <p className="text-sm text-[#00FFD1]/80">מבחר תספורות</p>
            <p className="text-sm sm:text-base font-medium text-white">100+ תספורות</p>
          </div>
          <div className="rounded-2xl border border-[#00FFD1]/25 bg-[#0a0a0f] px-4 py-3 flex flex-col items-center justify-center gap-1 animate-barber-fade-in transition-all hover:shadow-[0_0_8px_rgba(0,255,209,0.25)]" style={{ animationDelay: "0.25s", animationFillMode: "backwards" }}>
            <p className="text-sm text-[#00FFD1]/80">סגנונות זקן</p>
            <p className="text-sm sm:text-base font-medium text-white">15+ סגנונות זקן</p>
          </div>
          <div className="rounded-2xl border border-[#00FFD1]/25 bg-[#0a0a0f] px-4 py-3 flex flex-col items-center justify-center gap-1 animate-barber-fade-in transition-all hover:shadow-[0_0_8px_rgba(0,255,209,0.25)]" style={{ animationDelay: "0.3s", animationFillMode: "backwards" }}>
            <p className="text-sm text-[#00FFD1]/80">מנוע ניתוח</p>
            <p className="text-sm sm:text-base font-medium text-white">ניתוח פנים AI</p>
          </div>
        </section>

        {/* Bottom CTA (only when no image uploaded yet) */}
        <section className="pt-2 space-y-2 text-center">
          {!hasHostedImage && (
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="w-full rounded-xl border border-[#00FFD1] bg-[#0a0a0f] text-[#00FFD1] font-semibold py-3.5 text-sm sm:text-base shadow-[0_0_8px_rgba(0,255,209,0.3)] transition-all hover:shadow-[0_0_16px_rgba(0,255,209,0.45)] hover:bg-[#00FFD1]/10"
            >
              העלה תמונה
            </button>
          )}
          <p className="text-sm text-[#9CA3AF]">
            {hasHostedImage
              ? "בשלב הבא תמשיך למסלול שבחרת ותראה את מסך הניתוח"
              : "העלה סלפי אחד וקבל המלצות מותאמות"}
          </p>
        </section>
      </section>
    </main>
  );
}


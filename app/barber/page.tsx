"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BARBER_ANALYSIS_ENGINE_STORAGE_KEY,
  BARBER_FLOW_STORAGE_KEY,
  BARBER_SELFIE_STORAGE_KEY,
  BARBER_STYLE_STORAGE_KEY,
  BARBER_USER_MODE_STORAGE_KEY,
} from "@/lib/barber-session";

type Flow = "men" | "women";
type UserMode = "personal" | "barber";

export default function BarberPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hostedSelfieUrl, setHostedSelfieUrl] = useState<string | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [userMode, setUserMode] = useState<UserMode>("personal");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const hasPreview = Boolean(previewUrl);
  const hasHostedImage = Boolean(hostedSelfieUrl);

  useEffect(() => {
    try {
      const storedSelfie = sessionStorage.getItem(BARBER_SELFIE_STORAGE_KEY);
      if (storedSelfie?.startsWith("http")) {
        setHostedSelfieUrl(storedSelfie);
        setPreviewUrl(storedSelfie);
      }

      const storedFlow = sessionStorage.getItem(BARBER_FLOW_STORAGE_KEY);
      if (storedFlow === "men" || storedFlow === "women") {
        setSelectedFlow(storedFlow);
      }

      const storedMode = sessionStorage.getItem(BARBER_USER_MODE_STORAGE_KEY);
      if (storedMode === "personal" || storedMode === "barber") {
        setUserMode(storedMode);
      }
    } catch {
      // Session storage is optional. The UI can still work without persistence.
    }
  }, []);

  const chooseMode = (mode: UserMode) => {
    setUserMode(mode);
    try {
      sessionStorage.setItem(BARBER_USER_MODE_STORAGE_KEY, mode);
    } catch {
      // ignore storage errors
    }
  };

  const chooseFlow = (flow: Flow) => {
    setSelectedFlow(flow);
    try {
      sessionStorage.setItem(BARBER_FLOW_STORAGE_KEY, flow);
    } catch {
      // ignore storage errors
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const uploadSelfie = async (file: File) => {
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/barber/selfie-upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Upload failed");
      }

      setHostedSelfieUrl(data.url);

      try {
        sessionStorage.setItem(BARBER_SELFIE_STORAGE_KEY, data.url);
        sessionStorage.setItem(BARBER_ANALYSIS_ENGINE_STORAGE_KEY, "alt");
        sessionStorage.setItem(BARBER_USER_MODE_STORAGE_KEY, userMode);
        sessionStorage.removeItem(BARBER_STYLE_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
    } catch {
      setHostedSelfieUrl(null);
      setUploadError("לא הצלחנו להעלות את התמונה. נסה שוב בעוד רגע.");
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
      if (typeof reader.result === "string") {
        setPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);

    void uploadSelfie(file);
  };

  const continueToStyles = () => {
    if (!hasHostedImage) {
      setUploadError("קודם מעלים תמונה.");
      openFilePicker();
      return;
    }

    if (!selectedFlow) {
      setUploadError("בחר מה בא לך לנסות.");
      return;
    }

    try {
      sessionStorage.setItem(BARBER_USER_MODE_STORAGE_KEY, userMode);
      sessionStorage.setItem(BARBER_FLOW_STORAGE_KEY, selectedFlow);
    } catch {
      // ignore storage errors
    }

    router.push(
      selectedFlow === "women" ? "/barber/women/analysis" : "/barber/analysis",
    );
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-hidden bg-[#0d0d0f] text-[#f7f3eb]"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,117,76,0.16),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(92,209,182,0.11),transparent_28%),linear-gradient(180deg,#121216_0%,#0d0d0f_58%,#09090a_100%)]" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xl font-black tracking-[-0.04em] sm:text-2xl">
              BarBerBe
            </p>
            <p className="mt-0.5 text-[11px] text-white/45">TRY IT BEFORE YOU CUT IT</p>
          </div>

          <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-1 text-sm backdrop-blur">
            <button
              type="button"
              onClick={() => chooseMode("personal")}
              className={`rounded-full px-3.5 py-2 transition sm:px-4 ${
                userMode === "personal"
                  ? "bg-[#f7f3eb] text-[#151518]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              בשבילי
            </button>
            <button
              type="button"
              onClick={() => chooseMode("barber")}
              className={`rounded-full px-3.5 py-2 transition sm:px-4 ${
                userMode === "barber"
                  ? "bg-[#f7f3eb] text-[#151518]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              אני ספר/ית
            </button>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-14">
          <div className="order-2 space-y-7 lg:order-1">
            <div className="space-y-4">
              <span className="inline-flex items-center rounded-full border border-[#ff754c]/30 bg-[#ff754c]/10 px-3 py-1 text-xs font-semibold text-[#ff9b7c]">
                {userMode === "barber" ? "ייעוץ ויזואלי מול הלקוח" : "סלפי אחד. כמה לוקים. בלי לנחש."}
              </span>

              <div className="space-y-3">
                <h1 className="max-w-xl text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                  לראות את הלוק
                  <br />
                  <span className="text-[#ff754c]">לפני המספריים.</span>
                </h1>
                <p className="max-w-lg text-base leading-7 text-white/58 sm:text-lg">
                  {userMode === "barber"
                    ? "מעלים תמונה, בוחרים כיוון ומראים ללקוח איך הוא יכול להיראות לפני שמתחילים לעבוד."
                    : "מעלים תמונה, בוחרים כיוון ורואים איך תספורת, זקן או עיצוב שיער נראים עליך באמת."}
                </p>
              </div>
            </div>

            {hasHostedImage && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-white/78">מה בא לך לנסות?</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => chooseFlow("men")}
                    className={`rounded-2xl border p-4 text-right transition ${
                      selectedFlow === "men"
                        ? "border-[#ff754c] bg-[#ff754c]/12 shadow-[0_0_0_1px_rgba(255,117,76,0.2)]"
                        : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.055]"
                    }`}
                  >
                    <span className="text-2xl">✂️</span>
                    <span className="mt-2 block font-bold">תספורות + זקן</span>
                    <span className="mt-1 block text-sm text-white/48">
                      קצרים, פיידים, קלאסי, זיפים ולוקים מלאים
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => chooseFlow("women")}
                    className={`rounded-2xl border p-4 text-right transition ${
                      selectedFlow === "women"
                        ? "border-[#5cd1b6] bg-[#5cd1b6]/10 shadow-[0_0_0_1px_rgba(92,209,182,0.18)]"
                        : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.055]"
                    }`}
                  >
                    <span className="text-2xl">💇</span>
                    <span className="mt-2 block font-bold">עיצובי שיער</span>
                    <span className="mt-1 block text-sm text-white/48">
                      אורכים, שכבות, נפח, מרקם וכיוונים לסלון
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={continueToStyles}
                  className="mt-1 w-full rounded-2xl bg-[#f7f3eb] px-5 py-4 text-base font-black text-[#151518] transition hover:scale-[1.01] hover:bg-white active:scale-[0.99]"
                >
                  {userMode === "barber" ? "פתח ייעוץ ללקוח" : "תראו לי לוקים"}
                </button>
              </div>
            )}

            {!hasHostedImage && (
              <div className="flex flex-wrap gap-2 text-xs text-white/42">
                <span className="rounded-full border border-white/8 px-3 py-1.5">שומר על הזהות</span>
                <span className="rounded-full border border-white/8 px-3 py-1.5">לפני / אחרי</span>
                <span className="rounded-full border border-white/8 px-3 py-1.5">מצב ספר/ית</span>
              </div>
            )}

            {uploadError && (
              <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {uploadError}
              </p>
            )}
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative mx-auto max-w-xl">
              <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-[#ff754c]/18 via-transparent to-[#5cd1b6]/12 blur-2xl" />

              <button
                type="button"
                onClick={openFilePicker}
                className="group relative block aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#17171b] text-right shadow-[0_30px_90px_rgba(0,0,0,0.4)]"
              >
                {hasPreview ? (
                  <>
                    <img
                      src={previewUrl ?? undefined}
                      alt="התמונה שהועלתה"
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-5 pb-5 pt-16">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="font-bold text-white">
                            {uploading ? "מעלה את התמונה..." : "מעולה. זה הבסיס שלנו."}
                          </p>
                          <p className="mt-1 text-sm text-white/58">
                            לחץ על התמונה כדי להחליף
                          </p>
                        </div>
                        <span className={`h-3 w-3 rounded-full ${
                          uploading ? "animate-pulse bg-[#ffb49d]" : "bg-[#5cd1b6]"
                        }`} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f7f3eb] text-3xl text-[#151518] transition group-hover:scale-105">
                      +
                    </div>
                    <p className="text-xl font-black">העלה תמונה טובה שלך</p>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-white/48">
                      פנים ברורות, תאורה טובה, והשיער בתוך הפריים. אנחנו נשמור את האדם ונחליף רק את הלוק.
                    </p>
                    <span className="mt-5 rounded-full bg-[#ff754c] px-5 py-2.5 text-sm font-bold text-white">
                      בחר תמונה
                    </span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        <footer className="grid gap-3 border-t border-white/8 py-5 text-sm text-white/42 sm:grid-cols-3">
          <p>לקהל הרחב: משחקים עם לוקים לפני שמחליטים.</p>
          <p>לספרים: מראים כיוון לפני התספורת.</p>
          <p className="sm:text-left">מנוע הדמיה: Nano Banana 2</p>
        </footer>
      </section>
    </main>
  );
}

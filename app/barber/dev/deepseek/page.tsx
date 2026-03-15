"use client";

import { useState } from "react";

type ExperimentalResponse = {
  analysis?: unknown;
  raw?: string;
  error?: string;
};

export default function BarberDeepSeekDevPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExperimentalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setError(null);
    setResult(null);

    if (!imageUrl.trim()) {
      setError("נא להזין כתובת תמונה (imageUrl) תקינה.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/barber/analyze-deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageUrl.trim() }),
      });

      const data = (await res.json()) as ExperimentalResponse & {
        rawPreview?: string;
      };

      if (!res.ok) {
        setError(
          data.error ||
            `הבקשה נכשלה עם סטטוס ${res.status}.` +
              (data.rawPreview ? ` Preview: ${data.rawPreview}` : ""),
        );
      } else {
        setResult(data);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "אירעה שגיאה לא צפויה בבקשה.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050509] text-white flex flex-col">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <header className="border-b border-[#1F2937] pb-4">
          <h1 className="text-lg sm:text-xl font-semibold text-cyan-300">
            BarBerBe – DeepSeek DEV
          </h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            בדיקה ידנית של /api/barber/analyze-deepseek באמצעות הדבקת imageUrl
            ולחיצה על כפתור אחד. מיועד לשימוש פנימי בלבד.
          </p>
        </header>

        <section className="space-y-4 rounded-2xl border border-[#1F2937] bg-[#020617] p-4 sm:p-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#E5E7EB] text-right">
              imageUrl לבדיקה
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-[#374151] bg-[#020617] px-3 py-2 text-sm text-white placeholder-[#6B7280] focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="https://res.cloudinary.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <p className="text-xs text-[#9CA3AF] text-right">
              הדביקו כאן כתובת של סלפי שהועלה דרך BarBerBe (או כל תמונה רלוונטית
              לבדיקה).
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            {error && (
              <div className="flex-1 rounded-md bg-red-900/40 px-3 py-2 text-xs text-red-200 text-right">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={handleRun}
              disabled={loading}
              className="ml-auto inline-flex items-center justify-center rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-black shadow-sm transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-600/60"
            >
              {loading ? "מריץ בדיקה..." : "Run DeepSeek test"}
            </button>
          </div>
        </section>

        {result && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-[#1F2937] bg-[#020617] p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-[#E5E7EB] mb-2 text-right">
                analysis (פלט מנותח)
              </h2>
              <pre className="max-h-80 overflow-auto rounded bg-black/50 p-3 text-[11px] leading-snug text-[#E5E7EB]">
{JSON.stringify(result.analysis, null, 2)}
              </pre>
            </div>

            <div className="rounded-2xl border border-[#1F2937] bg-[#020617] p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-[#E5E7EB] mb-2 text-right">
                raw (כפי שהגיע מהמודל)
              </h2>
              <pre className="max-h-80 overflow-auto rounded bg-black/50 p-3 text-[11px] leading-snug text-[#E5E7EB]">
{result.raw}
              </pre>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}


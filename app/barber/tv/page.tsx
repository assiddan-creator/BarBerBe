"use client";

import { useEffect, useMemo, useState } from "react";
import { SkinBackdrop } from "@/components/barber/SkinBackdrop";
import { getConfiguredBarberSkin } from "@/lib/barber-skins";
import {
  BARBER_TV_DISPLAY_CODE_STORAGE_KEY,
  DEFAULT_SALON_TV_PAYLOAD,
  type SalonTvSessionSnapshot,
} from "@/lib/barber-tv";

type TvStatus =
  | "loading"
  | "setup"
  | "waiting"
  | "paired"
  | "unconfigured"
  | "error";

function storeDisplayCode(value: string | null) {
  try {
    if (value) {
      localStorage.setItem(BARBER_TV_DISPLAY_CODE_STORAGE_KEY, value);
    } else {
      localStorage.removeItem(BARBER_TV_DISPLAY_CODE_STORAGE_KEY);
    }
  } catch {
    // Smart TV browsers can have restricted storage.
  }
}

function readStoredDisplayCode(): string | null {
  try {
    return localStorage.getItem(BARBER_TV_DISPLAY_CODE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export default function SalonTvPage() {
  const skin = getConfiguredBarberSkin();
  const [status, setStatus] = useState<TvStatus>("loading");
  const [snapshot, setSnapshot] =
    useState<SalonTvSessionSnapshot | null>(null);

  const code = snapshot?.code ?? null;
  const payload = snapshot?.payload ?? DEFAULT_SALON_TV_PAYLOAD;

  const startPairing = async () => {
    setStatus("loading");

    try {
      const response = await fetch("/api/barber/tv/session", {
        method: "POST",
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | SalonTvSessionSnapshot
        | { error?: string }
        | null;

      if (response.status === 503) {
        setStatus("unconfigured");
        return;
      }

      if (!response.ok || !data || !("code" in data)) {
        setStatus("error");
        return;
      }

      setSnapshot(data);
      storeDisplayCode(data.code);
      setStatus(data.paired ? "paired" : "waiting");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const readSession = async (sessionCode: string) => {
      try {
        const response = await fetch(
          `/api/barber/tv/session?code=${encodeURIComponent(sessionCode)}`,
          { cache: "no-store" },
        );
        const data = (await response.json().catch(() => null)) as
          | SalonTvSessionSnapshot
          | { error?: string }
          | null;

        if (cancelled) return;

        if (response.status === 503) {
          setStatus("unconfigured");
          return;
        }

        if (response.status === 404 || response.status === 410) {
          storeDisplayCode(null);
          setSnapshot(null);
          setStatus("setup");
          return;
        }

        if (!response.ok || !data || !("code" in data)) {
          setStatus("error");
          return;
        }

        setSnapshot(data);
        setStatus(data.paired ? "paired" : "waiting");
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    const poll = async () => {
      const sessionCode = readStoredDisplayCode();

      if (!sessionCode) {
        setStatus((current) =>
          current === "loading" ? "setup" : current,
        );
      } else {
        await readSession(sessionCode);
      }

      if (!cancelled) {
        timer = window.setTimeout(poll, 1800);
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const idleProducts = useMemo(
    () =>
      payload.featuredProducts
        ?.filter((product) => product.active)
        .slice(0, 4) ?? [],
    [payload.featuredProducts],
  );

  const payloadAgeMs = Math.max(0, Date.now() - (payload.updatedAt || 0));
  const effectiveMode =
    payload.mode === "client" && payloadAgeMs > 2 * 60 * 1000
      ? "idle"
      : payload.mode === "product" && payloadAgeMs > 3 * 60 * 1000
        ? "idle"
        : payload.mode;

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[var(--skin-bg)] text-[var(--skin-text)]"
    >
      <SkinBackdrop media={skin.media.home} className="fixed" />
      <div className="absolute inset-0 bg-black/35" />

      <div className="relative flex min-h-screen flex-col px-[5vw] py-[5vh]">
        <header className="flex items-center justify-between gap-8">
          <div>
            <p className="text-[clamp(1.3rem,2vw,2rem)] font-black">
              {skin.brand.name}
            </p>
            <p className="mt-1 text-[clamp(.7rem,1vw,1rem)] text-white/45">
              Salon Screen
            </p>
          </div>

          {status === "paired" && (
            <span className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-white/45">
              מסך מחובר
            </span>
          )}
        </header>

        <section className="flex flex-1 items-center justify-center">
          {status === "loading" && (
            <p className="text-2xl text-white/45">מכין את מסך המספרה…</p>
          )}

          {status === "setup" && (
            <div className="max-w-3xl text-center">
              <p className="text-[clamp(2.4rem,5vw,5rem)] font-black">
                מסך המספרה מוכן
              </p>
              <p className="mx-auto mt-5 max-w-2xl text-[clamp(1rem,1.5vw,1.5rem)] leading-8 text-white/48">
                קוד החיבור נשאר מוסתר. כשהספר רוצה לחבר טלפון חדש,
                מפעילים כאן חלון חיבור קצר עם השלט.
              </p>
              <button
                type="button"
                autoFocus
                onClick={() => void startPairing()}
                className="mt-9 rounded-2xl bg-[var(--skin-accent)] px-8 py-4 text-[clamp(1rem,1.5vw,1.35rem)] font-black text-white outline-none ring-offset-4 ring-offset-black focus:ring-2 focus:ring-white/70"
              >
                פתח חיבור ל־5 דקות
              </button>
            </div>
          )}

          {status === "unconfigured" && (
            <div className="max-w-2xl text-center">
              <p className="text-4xl font-black">Salon TV מוכן לחיבור</p>
              <p className="mt-4 text-xl leading-8 text-white/50">
                שכבת הסנכרון עדיין לא הוגדרה בשרת. המסך עצמו כבר מוכן.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="max-w-2xl text-center">
              <p className="text-4xl font-black">לא הצלחנו לחבר את המסך</p>
              <p className="mt-4 text-xl text-white/45">
                אפשר לרענן את הדף ולנסות שוב.
              </p>
            </div>
          )}

          {status === "waiting" && code && (
            <div className="max-w-3xl text-center">
              <p className="text-[clamp(2rem,4vw,4rem)] font-black">
                חבר את הטלפון של הספר
              </p>
              <p className="mt-5 text-[clamp(1rem,1.5vw,1.5rem)] text-white/48">
                באפליקציה של הספר בחר “חבר מסך במספרה” והזן:
              </p>
              <div className="mt-8 tracking-[0.25em] text-[clamp(4rem,11vw,9rem)] font-black leading-none">
                {code}
              </div>
              <p className="mt-8 text-sm text-white/30">
                הקוד תקף ל־5 דקות בלבד. אחרי החיבור הוא נעלם ורק
                הטלפון שחיבר את המסך יכול לשלוט בו.
              </p>
            </div>
          )}

          {status === "paired" &&
            effectiveMode === "client" &&
            payload.client && (
              <div className="grid w-full max-w-[1500px] gap-[3vw] lg:grid-cols-2">
                {payload.client.beforeUrl && (
                  <div className="relative overflow-hidden rounded-[2vw] border border-white/10 bg-black/25">
                    <img
                      src={payload.client.beforeUrl}
                      alt="לפני"
                      className="aspect-[4/5] h-full w-full object-contain"
                    />
                    <span className="absolute right-4 top-4 rounded-full bg-black/70 px-4 py-2 text-sm">
                      לפני
                    </span>
                  </div>
                )}
                <div className="relative overflow-hidden rounded-[2vw] border border-white/10 bg-black/25">
                  <img
                    src={payload.client.afterUrl}
                    alt={payload.client.title}
                    className="aspect-[4/5] h-full w-full object-contain"
                  />
                  <span className="absolute right-4 top-4 rounded-full bg-[var(--skin-accent)] px-4 py-2 text-sm font-bold">
                    {payload.client.favorite ? "★ נבחר" : "אחרי"}
                  </span>
                </div>

                <div className="text-center lg:col-span-2">
                  {payload.client.clientName && (
                    <p className="text-xl text-white/45">
                      {payload.client.clientName}
                    </p>
                  )}
                  <h1 className="mt-2 text-[clamp(2rem,4vw,4.5rem)] font-black">
                    {payload.client.title}
                  </h1>
                </div>
              </div>
            )}

          {status === "paired" &&
            effectiveMode === "product" &&
            payload.product && (
              <div className="grid w-full max-w-[1300px] items-center gap-[5vw] lg:grid-cols-[.8fr_1.2fr]">
                <div className="overflow-hidden rounded-[2vw] border border-white/10 bg-white/[0.03] p-[2vw]">
                  {payload.product.imageUrl ? (
                    <img
                      src={payload.product.imageUrl}
                      alt={payload.product.name}
                      className="mx-auto aspect-square max-h-[55vh] w-full object-contain"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-[8vw]">
                      🧴
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[clamp(1rem,1.5vw,1.4rem)] font-bold text-[var(--skin-accent)]">
                    נמצא אצלנו במספרה
                  </p>
                  <h1 className="mt-4 text-[clamp(2.5rem,5vw,5.5rem)] font-black leading-[1.05]">
                    {payload.product.name}
                  </h1>
                  {payload.product.note && (
                    <p className="mt-5 max-w-2xl text-[clamp(1rem,1.5vw,1.5rem)] leading-8 text-white/55">
                      {payload.product.note}
                    </p>
                  )}
                  {typeof payload.product.price === "number" && (
                    <p className="mt-7 text-[clamp(2rem,3vw,3.5rem)] font-black">
                      ₪{payload.product.price}
                    </p>
                  )}
                </div>
              </div>
            )}

          {status === "paired" && effectiveMode === "idle" && (
            <div className="w-full max-w-[1500px] text-center">
              <p className="text-[clamp(1.2rem,1.8vw,1.8rem)] text-white/45">
                {skin.brand.tagline}
              </p>
              <h1 className="mt-4 text-[clamp(3rem,7vw,7rem)] font-black tracking-[-0.04em]">
                הלוק הבא מתחיל כאן
              </h1>

              {idleProducts.length > 0 && (
                <div className="mt-[7vh] grid gap-[1.5vw] sm:grid-cols-2 lg:grid-cols-4">
                  {idleProducts.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-[1.6vw] border border-white/10 bg-black/25 p-[1.4vw] text-right backdrop-blur-sm"
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="aspect-square w-full rounded-[1vw] object-contain"
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center text-[4vw]">
                          🧴
                        </div>
                      )}
                      <p className="mt-4 text-[clamp(1rem,1.5vw,1.5rem)] font-black">
                        {product.name}
                      </p>
                      {typeof product.price === "number" && (
                        <p className="mt-1 text-[clamp(.9rem,1.2vw,1.2rem)] text-white/50">
                          ₪{product.price}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <footer className="text-center text-xs text-white/20">
          תצוגה שקטה · BarBerBe לא מנגן שמע
        </footer>
      </div>
    </main>
  );
}

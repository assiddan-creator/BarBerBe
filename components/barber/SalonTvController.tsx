"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ALL_PRODUCT_CATEGORIES,
} from "@/lib/barber-products";
import {
  WOMEN_PRODUCT_CATEGORIES,
} from "@/lib/women-products";
import {
  createSalonProductId,
  matchSalonProductsToCategories,
  readSalonProducts,
  writeSalonProducts,
  type SalonProduct,
} from "@/lib/barber-salon-products";
import {
  BARBER_TV_CONTROLLER_STORAGE_KEY,
  type SalonTvClientView,
  type SalonTvPayload,
} from "@/lib/barber-tv";

interface TvControllerConnection {
  code: string;
  controllerToken: string;
  expiresAt: string;
}

interface SalonTvControllerProps {
  clientView?: SalonTvClientView | null;
  suggestedCategoryIds?: string[];
}

const CATEGORY_OPTIONS = [
  ...ALL_PRODUCT_CATEGORIES.map((item) => ({
    id: item.id,
    nameHe: item.nameHe,
  })),
  ...WOMEN_PRODUCT_CATEGORIES.map((item) => ({
    id: item.id,
    nameHe: item.nameHe,
  })),
].filter(
  (item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index,
);

export function SalonTvController({
  clientView,
  suggestedCategoryIds = [],
}: SalonTvControllerProps) {
  const [connection, setConnection] =
    useState<TvControllerConnection | null>(null);
  const [pairCode, setPairCode] = useState("");
  const [products, setProducts] = useState<SalonProduct[]>([]);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    imageUrl: "",
    categoryId: "",
    note: "",
  });

  useEffect(() => {
    setProducts(readSalonProducts());

    try {
      const raw = localStorage.getItem(BARBER_TV_CONTROLLER_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as TvControllerConnection;
      if (
        parsed?.code &&
        parsed?.controllerToken &&
        parsed?.expiresAt &&
        new Date(parsed.expiresAt).getTime() > Date.now()
      ) {
        setConnection(parsed);
      } else {
        localStorage.removeItem(BARBER_TV_CONTROLLER_STORAGE_KEY);
      }
    } catch {
      // Controller persistence is optional.
    }
  }, []);

  const featuredProducts = useMemo(
    () =>
      matchSalonProductsToCategories(
        products,
        suggestedCategoryIds,
        4,
      ),
    [products, suggestedCategoryIds],
  );

  const persistConnection = (next: TvControllerConnection | null) => {
    setConnection(next);
    try {
      if (next) {
        localStorage.setItem(
          BARBER_TV_CONTROLLER_STORAGE_KEY,
          JSON.stringify(next),
        );
      } else {
        localStorage.removeItem(BARBER_TV_CONTROLLER_STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures.
    }
  };

  const claimDisplay = async () => {
    if (!/^\d{6}$/.test(pairCode)) {
      setStatusText("צריך להזין את הקוד בן 6 הספרות שמופיע בטלוויזיה.");
      return;
    }

    setBusy(true);
    setStatusText(null);

    try {
      const response = await fetch("/api/barber/tv/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pairCode }),
      });
      const data = (await response.json().catch(() => null)) as
        | {
            code?: string;
            controllerToken?: string;
            expiresAt?: string;
            error?: string;
          }
        | null;

      if (
        response.ok &&
        data?.code &&
        data.controllerToken &&
        data.expiresAt
      ) {
        persistConnection({
          code: data.code,
          controllerToken: data.controllerToken,
          expiresAt: data.expiresAt,
        });
        setPairCode("");
        setStatusText("המסך מחובר. רק הטלפון הזה יכול לשלוט בו.");
        return;
      }

      if (response.status === 503) {
        setStatusText("סנכרון הטלוויזיה עדיין לא מחובר לשרת.");
      } else if (response.status === 409) {
        setStatusText("המסך כבר מחובר לטלפון אחר. צריך לאפס אותו קודם.");
      } else {
        setStatusText("לא הצלחנו לחבר את המסך. בדוק את הקוד ונסה שוב.");
      }
    } catch {
      setStatusText("לא הצלחנו להגיע לשרת הטלוויזיה.");
    } finally {
      setBusy(false);
    }
  };

  const sendPayload = async (payload: SalonTvPayload) => {
    if (!connection || busy) return;

    setBusy(true);
    setStatusText(null);

    try {
      const response = await fetch("/api/barber/tv/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: connection.code,
          controllerToken: connection.controllerToken,
          payload,
        }),
      });

      if (response.ok) {
        setStatusText("הטלוויזיה עודכנה.");
        return;
      }

      if ([403, 404, 410].includes(response.status)) {
        persistConnection(null);
        setStatusText("החיבור למסך פג. צריך לחבר אותו מחדש.");
      } else if (response.status === 503) {
        setStatusText("סנכרון הטלוויזיה עדיין לא מחובר לשרת.");
      } else {
        setStatusText("לא הצלחנו לעדכן את הטלוויזיה.");
      }
    } catch {
      setStatusText("לא הצלחנו לעדכן את הטלוויזיה.");
    } finally {
      setBusy(false);
    }
  };

  const showIdle = () =>
    sendPayload({
      mode: "idle",
      updatedAt: Date.now(),
      featuredProducts,
    });

  const showClient = () => {
    if (!clientView) {
      setStatusText("אין כרגע תוצאה של לקוח להצגה.");
      return;
    }

    void sendPayload({
      mode: "client",
      updatedAt: Date.now(),
      client: clientView,
      featuredProducts,
    });
  };

  const showProduct = (product: SalonProduct) =>
    sendPayload({
      mode: "product",
      updatedAt: Date.now(),
      product,
      featuredProducts,
    });

  const resetDisplay = async () => {
    if (!connection || busy) return;

    setBusy(true);
    try {
      await fetch("/api/barber/tv/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: connection.code,
          controllerToken: connection.controllerToken,
        }),
      });
    } finally {
      persistConnection(null);
      setBusy(false);
      setStatusText("המסך נותק. בטלוויזיה יופיע קוד חדש.");
    }
  };

  const addProduct = () => {
    const name = form.name.trim();
    if (!name) {
      setStatusText("צריך לתת למוצר שם.");
      return;
    }

    const priceNumber = form.price.trim()
      ? Number(form.price)
      : undefined;

    const next: SalonProduct = {
      id: createSalonProductId(),
      name: name.slice(0, 100),
      active: true,
      ...(priceNumber !== undefined &&
      Number.isFinite(priceNumber) &&
      priceNumber >= 0
        ? { price: priceNumber }
        : {}),
      ...(form.imageUrl.trim().startsWith("https://")
        ? { imageUrl: form.imageUrl.trim() }
        : {}),
      ...(form.categoryId ? { categoryId: form.categoryId } : {}),
      ...(form.note.trim() ? { note: form.note.trim().slice(0, 220) } : {}),
    };

    const nextProducts = [next, ...products].slice(0, 60);
    setProducts(nextProducts);
    writeSalonProducts(nextProducts);
    setForm({
      name: "",
      price: "",
      imageUrl: "",
      categoryId: "",
      note: "",
    });
    setStatusText("המוצר נוסף למוצרי המספרה.");
  };

  const removeProduct = (id: string) => {
    const next = products.filter((product) => product.id !== id);
    setProducts(next);
    writeSalonProducts(next);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-black">מסך המספרה</p>
          <p className="mt-1 text-xs text-white/38">
            הטלוויזיה היא תצוגה בלבד. השליטה נשארת אצל הספר.
          </p>
        </div>
        {connection && (
          <span className="rounded-full border border-[var(--skin-accent-alt)]/25 px-3 py-1 text-xs text-[var(--skin-accent-alt)]">
            מחובר · {connection.code}
          </span>
        )}
      </div>

      {!connection ? (
        <div className="mt-4 flex gap-2">
          <input
            inputMode="numeric"
            maxLength={6}
            value={pairCode}
            onChange={(event) =>
              setPairCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="קוד מהטלוויזיה"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm outline-none placeholder:text-white/25 focus:border-white/25"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void claimDisplay()}
            className="rounded-xl bg-[var(--skin-text)] px-4 py-2.5 text-sm font-black text-[var(--skin-bg)] disabled:opacity-40"
          >
            חבר מסך
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void showIdle()}
            className="rounded-xl border border-white/10 px-3 py-2.5 text-sm font-bold hover:bg-white/[0.04]"
          >
            מסך רגיל
          </button>
          <button
            type="button"
            disabled={busy || !clientView}
            onClick={showClient}
            className="rounded-xl bg-[var(--skin-accent)] px-3 py-2.5 text-sm font-black text-white disabled:opacity-35"
          >
            הצג לקוח
          </button>
        </div>
      )}

      {statusText && (
        <p className="mt-3 text-xs leading-5 text-white/52">{statusText}</p>
      )}

      <details className="mt-4 border-t border-white/8 pt-4">
        <summary className="cursor-pointer text-sm font-bold text-white/68">
          מוצרי המספרה · {products.length}
        </summary>

        {products.length > 0 && (
          <div className="mt-3 space-y-2">
            {products.slice(0, 8).map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/15 p-2.5"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-11 w-11 rounded-lg object-contain"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/[0.04]">
                    🧴
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{product.name}</p>
                  {typeof product.price === "number" && (
                    <p className="text-xs text-white/40">₪{product.price}</p>
                  )}
                </div>
                {connection && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void showProduct(product)}
                    className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-bold"
                  >
                    הצג
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeProduct(product.id)}
                  className="px-2 py-1 text-xs text-white/30 hover:text-white/70"
                >
                  הסר
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-2">
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="שם המוצר"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              inputMode="decimal"
              value={form.price}
              onChange={(event) =>
                setForm((current) => ({ ...current, price: event.target.value }))
              }
              placeholder="מחיר"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
            />
            <select
              value={form.categoryId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  categoryId: event.target.value,
                }))
              }
              className="rounded-xl border border-white/10 bg-[#17171b] px-3 py-2 text-sm outline-none"
            >
              <option value="">קטגוריה</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameHe}
                </option>
              ))}
            </select>
          </div>
          <input
            value={form.imageUrl}
            onChange={(event) =>
              setForm((current) => ({ ...current, imageUrl: event.target.value }))
            }
            placeholder="קישור לתמונת מוצר · אופציונלי"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
          />
          <input
            value={form.note}
            onChange={(event) =>
              setForm((current) => ({ ...current, note: event.target.value }))
            }
            placeholder="משפט קצר למכירה · אופציונלי"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={addProduct}
            className="rounded-xl border border-white/10 px-3 py-2.5 text-sm font-bold hover:bg-white/[0.04]"
          >
            הוסף מוצר
          </button>
        </div>
      </details>

      {connection && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void resetDisplay()}
          className="mt-4 text-xs text-white/28 hover:text-white/60"
        >
          נתק ואפס את הטלוויזיה
        </button>
      )}
    </div>
  );
}

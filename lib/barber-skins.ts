export type BarberSkinMedia =
  | {
      type: "video";
      src: string;
      poster?: string;
      objectPosition?: string;
      overlay?: string;
    }
  | {
      type: "image";
      src: string;
      objectPosition?: string;
      overlay?: string;
    }
  | {
      type: "none";
      overlay?: string;
    };

export interface BarberSkin {
  id: string;
  brand: {
    name: string;
    tagline: string;
    logoSrc?: string;
  };
  theme: {
    background: string;
    surface: string;
    surfaceSoft: string;
    text: string;
    muted: string;
    accent: string;
    accentAlt: string;
    border: string;
    radius: string;
  };
  copy: {
    heroEyebrowPersonal: string;
    heroEyebrowBarber: string;
    heroTitle: string;
    heroTitleAccent: string;
    heroBodyPersonal: string;
    heroBodyBarber: string;
  };
  media: {
    home: BarberSkinMedia;
    styles: BarberSkinMedia;
    generating: BarberSkinMedia;
    result: BarberSkinMedia;
  };
}

/**
 * Skin registry.
 *
 * Product logic must not depend on a specific skin.
 * A skin can replace brand, colors, copy and media without changing the
 * upload -> style selection -> generation -> result flow.
 *
 * Future client-specific deployments can select a skin with:
 * NEXT_PUBLIC_BARBERBE_SKIN=<skin-id>
 */
export const BARBER_SKINS: Record<string, BarberSkin> = {
  "barberbe-core": {
    id: "barberbe-core",
    brand: {
      name: "BarBerBe",
      tagline: "TRY IT BEFORE YOU CUT IT",
    },
    theme: {
      background: "#0d0d0f",
      surface: "#17171b",
      surfaceSoft: "rgba(255,255,255,0.035)",
      text: "#f7f3eb",
      muted: "rgba(255,255,255,0.48)",
      accent: "#ff754c",
      accentAlt: "#5cd1b6",
      border: "rgba(255,255,255,0.10)",
      radius: "1.75rem",
    },
    copy: {
      heroEyebrowPersonal: "סלפי אחד. כמה לוקים. בלי לנחש.",
      heroEyebrowBarber: "ייעוץ ויזואלי מול הלקוח",
      heroTitle: "לראות את הלוק",
      heroTitleAccent: "לפני המספריים.",
      heroBodyPersonal:
        "מעלים תמונה, בוחרים כיוון ורואים איך תספורת, זקן או עיצוב שיער נראים עליך באמת.",
      heroBodyBarber:
        "מעלים תמונה, בוחרים כיוון ומראים ללקוח איך הוא יכול להיראות לפני שמתחילים לעבוד.",
    },
    media: {
      // Media slots intentionally start empty. We will create assets specifically
      // for each slot instead of baking decorative imagery into the UI.
      home: { type: "none", overlay: "rgba(8,8,10,0.28)" },
      styles: { type: "none", overlay: "rgba(8,8,10,0.48)" },
      generating: { type: "none", overlay: "rgba(8,8,10,0.46)" },
      result: { type: "none", overlay: "rgba(8,8,10,0.34)" },
    },
  },
};

export const DEFAULT_BARBER_SKIN_ID = "barberbe-core";

export function getBarberSkin(id?: string | null): BarberSkin {
  if (id && BARBER_SKINS[id]) return BARBER_SKINS[id];
  return BARBER_SKINS[DEFAULT_BARBER_SKIN_ID];
}

export function getConfiguredBarberSkin(): BarberSkin {
  return getBarberSkin(process.env.NEXT_PUBLIC_BARBERBE_SKIN);
}

export function barberSkinCssVariables(skin: BarberSkin): Record<string, string> {
  return {
    "--skin-bg": skin.theme.background,
    "--skin-surface": skin.theme.surface,
    "--skin-surface-soft": skin.theme.surfaceSoft,
    "--skin-text": skin.theme.text,
    "--skin-muted": skin.theme.muted,
    "--skin-accent": skin.theme.accent,
    "--skin-accent-alt": skin.theme.accentAlt,
    "--skin-border": skin.theme.border,
    "--skin-radius": skin.theme.radius,
  };
}

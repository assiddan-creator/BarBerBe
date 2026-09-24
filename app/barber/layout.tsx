import type { CSSProperties, ReactNode } from "react";
import {
  barberSkinCssVariables,
  getConfiguredBarberSkin,
} from "@/lib/barber-skins";

export default function BarberLayout({ children }: { children: ReactNode }) {
  const skin = getConfiguredBarberSkin();
  const style = barberSkinCssVariables(skin) as CSSProperties;

  return (
    <div
      data-barber-skin={skin.id}
      style={style}
      className="min-h-screen bg-[var(--skin-bg)] text-[var(--skin-text)]"
    >
      {children}
    </div>
  );
}

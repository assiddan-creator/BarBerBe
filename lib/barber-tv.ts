import type { SalonProduct } from "@/lib/barber-salon-products";

export type SalonTvMode = "idle" | "client" | "product";

export interface SalonTvClientView {
  clientName?: string;
  title: string;
  beforeUrl?: string;
  afterUrl: string;
  favorite: boolean;
}

export interface SalonTvPayload {
  mode: SalonTvMode;
  updatedAt: number;
  client?: SalonTvClientView;
  product?: SalonProduct;
  featuredProducts?: SalonProduct[];
}

export interface SalonTvSessionSnapshot {
  code: string;
  paired: boolean;
  expiresAt: string;
  payload: SalonTvPayload;
}

export const DEFAULT_SALON_TV_PAYLOAD: SalonTvPayload = {
  mode: "idle",
  updatedAt: 0,
  featuredProducts: [],
};

export const BARBER_TV_CONTROLLER_STORAGE_KEY = "barber_tv_controller";
export const BARBER_TV_DISPLAY_CODE_STORAGE_KEY = "barber_tv_display_code";

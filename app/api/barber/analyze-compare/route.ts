/**
 * Internal comparison endpoint: live vs alt analysis (same imageUrl).
 * For testing only. Not wired into UI. Do not use in production flow.
 *
 * Comparison checklist (MEN & WOMEN):
 * - JSON validity: response is parseable and has expected keys
 * - Empty output rate: model returns non-empty content
 * - Refusal/error rate: no refusal text; no 502 from route
 * - Schema adherence: normalized result passes validation
 * - Preset-id quality: recommended IDs are in the allowed set
 * - Confidence behavior: confidence is low|medium|high and sensible
 * - Latency: time to first byte / full response
 * - Overall usefulness: recommendations feel relevant for BarBerBe
 *
 * What to test side by side (per run):
 * - live vs alt: ok, status, ms, analysis shape, error
 * - MEN: topRecommendedHairstyles/Beards validity; beardCompatibility; confidence
 * - WOMEN: topRecommendedStyles validity; hairTexture; personalSummaryHe
 *
 * Go/no-go for replacing live: see report section C (not in UI; internal only).
 */

import { NextRequest, NextResponse } from "next/server";
import { POST as liveMen } from "@/app/api/barber/analyze/route";
import { POST as altMen } from "@/app/api/barber/analyze-alt/route";
import { POST as liveWomen } from "@/app/api/barber/women/analyze/route";
import { POST as altWomen } from "@/app/api/barber/women/analyze-alt/route";

type RunResult = {
  ok: boolean;
  status: number;
  ms: number;
  analysis: unknown;
  error: string | null;
};

async function runRoute(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<Response>,
): Promise<RunResult> {
  const t0 = Date.now();
  try {
    const res = await handler(request);
    const ms = Date.now() - t0;
    const data = (await res.json().catch(() => ({}))) as {
      analysis?: unknown;
      error?: string;
    };
    return {
      ok: res.ok,
      status: res.status,
      ms,
      analysis: data.analysis ?? null,
      error: data.error ?? null,
    };
  } catch (err) {
    const ms = Date.now() - t0;
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      status: 500,
      ms,
      analysis: null,
      error: message,
    };
  }
}

export async function POST(request: NextRequest) {
  let body: { imageUrl?: string; flow?: "men" | "women" | "both" };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const imageUrl = body?.imageUrl;
  if (!imageUrl || typeof imageUrl !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid imageUrl" },
      { status: 400 },
    );
  }

  const flow = body?.flow ?? "both";

  const base = "http://internal/";
  const buildReq = (path: string) =>
    new NextRequest(base + path, {
      method: "POST",
      body: JSON.stringify({ imageUrl }),
      headers: { "Content-Type": "application/json" },
    });

  const out: {
    men?: { live: RunResult; alt: RunResult };
    women?: { live: RunResult; alt: RunResult };
  } = {};

  if (flow === "men" || flow === "both") {
    const [live, alt] = await Promise.all([
      runRoute(buildReq("api/barber/analyze"), liveMen),
      runRoute(buildReq("api/barber/analyze-alt"), altMen),
    ]);
    out.men = { live, alt };
  }

  if (flow === "women" || flow === "both") {
    const [live, alt] = await Promise.all([
      runRoute(buildReq("api/barber/women/analyze"), liveWomen),
      runRoute(buildReq("api/barber/women/analyze-alt"), altWomen),
    ]);
    out.women = { live, alt };
  }

  return NextResponse.json(out);
}

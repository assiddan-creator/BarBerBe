"use client";

/**
 * Spinner overlay to show on top of the image when isGenerating.
 * Rendered inside the strict image wrapper (absolute inset-0 z-10).
 */
export function GenerationLoadingOverlay() {
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-md"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <div
          className="h-10 w-10 rounded-full border-2 border-[#2A2A3A] border-t-cyan-400/80 animate-spin"
          aria-hidden
        />
        <p className="text-sm text-[#A8A8B3]">מכין את התוצאה…</p>
      </div>
    </div>
  );
}

"use client";

import {
  useRef, useState, useCallback, useEffect, ChangeEvent,
} from "react";
import { fal } from "@fal-ai/client";

fal.config({ proxyUrl: "/api/fal/proxy" });

type InputMode = "camera" | "upload";

const PUBLIC_GALLERY_URL = "https://assi-johnny-web-gallery.vercel.app/gallery";

const DANCE_PRESETS = [
  { id: "1", label: "🕺 סנופ דוג",         url: "https://res.cloudinary.com/dqko2th7b/video/upload/v1772873122/kling_20260304_Motion_Control__637_0_gohjvs.mp4" },
  { id: "2", label: "🕴️ רספוטין",          url: "https://res.cloudinary.com/dqko2th7b/video/upload/v1772873134/kling_20260304_Motion_Control__1043_0_zjvwwv.mp4" },
  { id: "3", label: "💃 שייקינג אפ בייבי", url: "https://res.cloudinary.com/dqko2th7b/video/upload/v1772873146/kling_20260304_Motion_Control__5168_0_oq01lr.mp4" },
  { id: "4", label: "🤖 ריקוד 4 (בקרוב)", url: "https://res.cloudinary.com/demo/video/upload/v1692198000/docs/video_upload_example.mp4" },
  { id: "5", label: "⚡ ריקוד 5 (בקרוב)", url: "https://res.cloudinary.com/demo/video/upload/v1692198000/docs/video_upload_example.mp4" },
  { id: "6", label: "🥋 ריקוד 6 (בקרוב)", url: "https://res.cloudinary.com/demo/video/upload/v1692198000/docs/video_upload_example.mp4" },
  { id: "7", label: "🎤 ריקוד 7 (בקרוב)", url: "https://res.cloudinary.com/demo/video/upload/v1692198000/docs/video_upload_example.mp4" },
] as const;

const MODEL_OPTIONS = [
  { id: "hasselblad",    label: "האסלבלד פרימיום", modelId: "fal-ai/flux-2-pro/edit" as const },
  { id: "turbo-pro",     label: "טורבו פרו",        modelId: "fal-ai/nano-banana-pro/edit" as const },
  { id: "turbo-schnell", label: "טורבו מהיר",       modelId: "fal-ai/nano-banana-2/edit" as const },
  { id: "multi-subject", label: "קבוצות / זוגות",   modelId: "fal-ai/bytedance/seedream/v4.5/edit" as const },
] as const;
type ModelId = typeof MODEL_OPTIONS[number]["modelId"];

async function resizeAndCompress(source: Blob, maxDim = 1024, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(source);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No 2D context"));
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg", quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load error")); };
    img.src = objectUrl;
  });
}

export default function CinematicBooth() {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const capturedBlobRef = useRef<Blob | null>(null);
  /** Pending PoYo task IDs — polling continues after "Start Over" until upload to Cloudinary */
  const pendingVideoTaskIdsRef = useRef<Set<string>>(new Set());

  const [stream,            setStream]            = useState<MediaStream | null>(null);
  const [cameraActive,      setCameraActive]      = useState(false);
  const [inputMode,         setInputMode]         = useState<InputMode>("camera");
  const [sourcePreview,     setSourcePreview]     = useState<string | null>(null);
  const [capturedImage,     setCapturedImage]     = useState<string | null>(null);
  const [prompt,            setPrompt]            = useState("");
  const [outputUrl,         setOutputUrl]         = useState<string | null>(null);
  const [history,           setHistory]           = useState<string[]>([]);
  const [latency,           setLatency]           = useState<number | null>(null);
  const [status,            setStatus]            = useState("");
  const [isProcessing,      setIsProcessing]      = useState(false);
  const [error,             setError]             = useState<string | null>(null);
  const [countdown,         setCountdown]         = useState<0 | 1 | 2 | 3>(0);
  const [selectedModel,     setSelectedModel]     = useState<ModelId>(MODEL_OPTIONS[0].modelId);
  const [videoSubmitted,    setVideoSubmitted]    = useState(false);
  const [submittedTaskId,   setSubmittedTaskId]   = useState<string | null>(null);
  const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);
  const [selectedPreset,    setSelectedPreset]    = useState<string>(DANCE_PRESETS[0].url);

  // ✅ FIX: attach stream AFTER React commits <video> to DOM
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) { video.srcObject = stream; video.play().catch(() => {}); }
    else { video.srcObject = null; }
  }, [stream]);

  useEffect(() => {
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, [stream]);

  useEffect(() => { fetch("/api/fal/proxy", { method: "GET" }).catch(() => {}); }, []);

  // Background polling: first check after 15s (propagation), then every 10s. Handles 404/502 gracefully.
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const runPoll = async () => {
      const taskIds = Array.from(pendingVideoTaskIdsRef.current);
      if (taskIds.length === 0) return;
      for (const taskId of taskIds) {
        try {
          console.log("[polling] taskId:", taskId);
          const res = await fetch(`/api/video/kling?taskId=${encodeURIComponent(taskId)}`);
          let data: { status?: string; videoUrl?: string; error?: string };
          try {
            data = (await res.json()) as { status?: string; videoUrl?: string; error?: string };
          } catch {
            continue;
          }
          if (!res.ok) {
            if (res.status === 404 || res.status === 502) {
              console.warn("[polling] removing taskId after", res.status, ":", taskId);
              pendingVideoTaskIdsRef.current.delete(taskId);
            }
            continue;
          }
          if (data.status === "COMPLETED" && data.videoUrl) {
            pendingVideoTaskIdsRef.current.delete(taskId);
            await fetch("/api/cloudinary/upload-url", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileUrl: data.videoUrl }),
            }).catch(() => {});
          } else if (data.status === "FAILED") {
            pendingVideoTaskIdsRef.current.delete(taskId);
          }
        } catch {
          // retry next tick
        }
      }
    };
    const timeoutId = setTimeout(() => {
      runPoll();
      intervalId = setInterval(runPoll, 10_000);
    }, 15_000);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const uploadAndRunFal = useCallback(async (optimizedBlob: Blob) => {
    if (!prompt.trim()) { setError("אנא הכנס טקסט תיאור (פרומפט) קודם."); return; }
    setIsProcessing(true); setError(null); setOutputUrl(null); setLatency(null);
    const t0 = performance.now();
    try {
      setStatus("מעלה תמונה לענן…");
      const file = new File([optimizedBlob], "photo.jpg", { type: "image/jpeg" });
      const imageUrl = await fal.storage.upload(file);
      setStatus("מפעיל קסם הוליוודי (AI)…");
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel, userInput: prompt.trim(), imageUrl }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || `Transform failed: ${res.status}`);
      }
      const result = (await res.json()) as { images: { url: string }[] };
      const outputImageUrl = result.images?.[0]?.url;
      if (!outputImageUrl) throw new Error("No image in response");
      setLatency((performance.now() - t0) / 1000);
      setOutputUrl(outputImageUrl);
      setHistory((prev) => (prev.includes(outputImageUrl) ? prev : [outputImageUrl, ...prev]));
      setStatus("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "העיבוד נכשל, נסה שנית");
      setStatus("");
    } finally { setIsProcessing(false); }
  }, [prompt, selectedModel]);

  const runPipeline = useCallback(async (rawBlob: Blob) => {
    const optimized = await resizeAndCompress(rawBlob, 1024, 0.85);
    await uploadAndRunFal(optimized);
  }, [uploadAndRunFal]);

  // ✅ FIX: countdown uses an offscreen canvas created inline — not the hidden ref canvas
  // This avoids the race condition where the ref canvas is hidden/unmounted
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => {
      if (countdown === 1) {
        const video = videoRef.current;
        // Guard: video must be streaming (readyState >= 2 = HAVE_CURRENT_DATA)
        if (!video || video.readyState < 2) {
          setCountdown(0);
          return;
        }
        const w = video.videoWidth  || video.clientWidth  || 1280;
        const h = video.videoHeight || video.clientHeight || 720;

        // Create a fresh offscreen canvas — never hidden, no ref needed
        const offscreen = document.createElement("canvas");
        offscreen.width = w;
        offscreen.height = h;
        const ctx = offscreen.getContext("2d");
        if (!ctx) { setCountdown(0); return; }
        ctx.drawImage(video, 0, 0, w, h);

        offscreen.toBlob(
          async (b) => {
            if (!b) { setCountdown(0); return; }
            try {
              const optimized = await resizeAndCompress(b, 1024, 0.85);
              capturedBlobRef.current = optimized;
              setCapturedImage((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(optimized);
              });
            } finally {
              setCountdown(0);
            }
          },
          "image/jpeg",
          0.92
        );
      } else {
        setCountdown((c) => (c - 1) as 0 | 1 | 2 | 3);
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user", frameRate: { ideal: 30 } },
        audio: false,
      });
      setStream(mediaStream); setCameraActive(true);
    } catch { setError("גישה למצלמה נדחתה. בדוק הרשאות ורענן את הדף."); }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null); setCameraActive(false);
  }, [stream]);

  // ✅ FIX: verify video element is ready before starting countdown
  const startCountdown = useCallback(() => {
    if (!cameraActive || isProcessing || countdown !== 0) return;
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setError("המצלמה עדיין מתחממת — נסה שנית בעוד שנייה.");
      return;
    }
    setError(null);
    setCountdown(3);
  }, [cameraActive, isProcessing, countdown]);

  const retake = useCallback(() => {
    setCapturedImage((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    capturedBlobRef.current = null;
  }, []);

  const runTransform = useCallback(() => {
    const blob = capturedBlobRef.current;
    if (blob) uploadAndRunFal(blob);
  }, [uploadAndRunFal]);

  const submitVideo = useCallback(async () => {
    if (!outputUrl) return;
    setIsSubmittingVideo(true); setError(null);
    try {
      const res = await fetch("/api/video/kling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: outputUrl, reference_video_url: selectedPreset }),
      });
      let data: { taskId?: string; error?: string; details?: string };
      try { data = await res.json(); } catch { throw new Error(`שגיאת שרת ${res.status}`); }
      const newTaskId = data.taskId ?? (data as { task_id?: string }).task_id ?? null;
      if (!res.ok || !newTaskId) throw new Error(data.error || data.details || `שגיאה בשליחת וידאו (${res.status})`);

      console.log("[submitVideo] received taskId:", newTaskId);
      pendingVideoTaskIdsRef.current.add(String(newTaskId)); // global poll will handle completion → Cloudinary
      setSubmittedTaskId(String(newTaskId));
      setVideoSubmitted(true);
      setOutputUrl(null); setLatency(null);
      setCapturedImage((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
      capturedBlobRef.current = null; setSourcePreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה ביצירת הוידאו");
    } finally { setIsSubmittingVideo(false); }
  }, [outputUrl, selectedPreset]);

  const startOver = useCallback(() => {
    setVideoSubmitted(false); setSubmittedTaskId(null);
    setOutputUrl(null); setLatency(null);
    setCapturedImage((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    capturedBlobRef.current = null; setSourcePreview(null); setError(null);
  }, []);

  const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSourcePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
    await runPipeline(file);
    e.target.value = "";
  }, [runPipeline]);

  const switchMode = useCallback((mode: InputMode) => {
    setInputMode(mode); setError(null);
    if (mode === "camera") {
      startCamera();
      setCapturedImage((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
      capturedBlobRef.current = null;
    } else {
      stopCamera(); setSourcePreview(null);
      setCapturedImage((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
      capturedBlobRef.current = null;
    }
  }, [startCamera, stopCamera]);

  // ── מסך QR לאחר שליחת וידאו ────────────────────────────────────────────
  if (videoSubmitted) {
    const galleryUrl = submittedTaskId
      ? `${PUBLIC_GALLERY_URL}?taskId=${encodeURIComponent(submittedTaskId)}`
      : PUBLIC_GALLERY_URL;
    return (
      <main className="min-h-screen bg-[#040406] text-white flex flex-col items-center justify-center px-4 py-10" dir="rtl">
        <div className="max-w-md w-full flex flex-col items-center gap-8 text-center">
          <div className="text-6xl animate-bounce">🎬</div>
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-100">הוידאו נשלח לעריכה!</h2>
          <p className="text-zinc-400 text-sm">יעלה לגלריה בעוד כמה דקות. סרוק כדי להיכנס.</p>
          <div className="bg-white p-4 rounded-2xl shadow-xl">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(galleryUrl)}`}
              alt="QR" width={260} height={260} className="rounded-lg"
            />
          </div>
          <a href={galleryUrl} target="_blank" rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 text-sm underline">
            פתח גלריה בדפדפן
          </a>
          <button type="button" onClick={startOver}
            className="px-10 py-4 rounded-2xl font-bold bg-white text-black hover:bg-zinc-200 transition-colors">
            לקוח הבא
          </button>
        </div>
      </main>
    );
  }

  // ── ממשק ראשי ──────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#040406] text-white flex flex-col items-center px-4 py-10" dir="rtl">

      <header className="mb-10 text-center space-y-2">
        <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-br from-white to-zinc-600 bg-clip-text text-transparent leading-none">
          Assi Fast Booth
        </h1>
      </header>

      <div className="flex gap-1 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 mb-6 shadow-xl" dir="ltr">
        {(["camera", "upload"] as InputMode[]).map((mode) => (
          <button key={mode} onClick={() => switchMode(mode)}
            className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              inputMode === mode ? "bg-white text-black shadow-md" : "text-zinc-500 hover:text-zinc-300"
            }`}>
            {mode === "camera" ? "📷 מצלמה" : "🖼️ העלאה"}
          </button>
        ))}
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">

        {/* פאנל מקור */}
        <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-video flex flex-col items-center justify-center shadow-2xl">

          {/* ✅ video תמיד ב-DOM — opacity שולט על הנראות */}
          <video ref={videoRef} autoPlay playsInline muted
            className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
              inputMode === "camera" && cameraActive && !capturedImage && countdown === 0
                ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
          <canvas ref={canvasRef} className="hidden" aria-hidden />

          {inputMode === "camera" && capturedImage && (
            <>
              <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-cover z-[1]" />
              <div className="absolute bottom-3 left-3 right-3 z-[2] flex justify-center">
                <button type="button" onClick={retake}
                  className="px-6 py-2 rounded-xl text-sm font-semibold bg-zinc-800/90 border border-zinc-700 text-zinc-200">
                  צלם מחדש
                </button>
              </div>
            </>
          )}

          {inputMode === "upload" && sourcePreview && (
            <img src={sourcePreview} alt="Source" className="absolute inset-0 w-full h-full object-cover z-[1]" />
          )}

          {countdown > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
              <span className="text-[min(30vw,180px)] font-black text-white animate-pulse">{countdown}</span>
            </div>
          )}

          {inputMode === "camera" && cameraActive && !capturedImage && countdown === 0 && (
            <>
              <div className="absolute bottom-3 left-3 right-3 z-[2] flex justify-center">
                <button type="button" onClick={startCountdown}
                  className="px-8 py-3 rounded-xl text-lg font-bold bg-white/10 border border-zinc-500 text-white shadow-lg">
                  📷 צלם עכשיו
                </button>
              </div>
              <div className="absolute top-3 right-3 z-[2] flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full border border-zinc-800">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] uppercase text-zinc-400">שידור חי</span>
              </div>
            </>
          )}

          {inputMode === "camera" && !cameraActive && (
            <button type="button" onClick={startCamera} className="flex flex-col items-center gap-3 relative z-[1]">
              <div className="w-16 h-16 rounded-full border-2 border-zinc-700 hover:border-violet-500 flex items-center justify-center">
                <span className="text-2xl">📷</span>
              </div>
              <span className="text-sm text-zinc-500">לחץ להפעלת מצלמה</span>
            </button>
          )}

          {inputMode === "upload" && !sourcePreview && !isProcessing && (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-3 relative z-[1]">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center">
                <span className="text-2xl">⬆️</span>
              </div>
              <span className="text-sm text-zinc-500">בחר תמונה מהמכשיר</span>
            </button>
          )}
        </div>

        {/* פאנל פלט */}
        <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-video flex items-center justify-center shadow-2xl">
          {isProcessing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-black/80 backdrop-blur-lg">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border border-zinc-800" />
                <div className="absolute inset-0 rounded-full border-[3px] border-t-violet-500 animate-spin" />
              </div>
              <p className="text-sm text-zinc-300 font-bold animate-pulse">{status || "מעבד נתונים…"}</p>
            </div>
          )}

          {outputUrl ? (
            <>
              <img src={outputUrl} alt="AI Output" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 z-[2] bg-gradient-to-t from-black via-black/80 to-transparent pt-10 pb-3 px-3">
                <div className="grid grid-cols-4 md:grid-cols-7 gap-1.5 mb-2">
                  {DANCE_PRESETS.map((preset) => (
                    <button key={preset.id} type="button" onClick={() => setSelectedPreset(preset.url)}
                      className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border text-center ${
                        selectedPreset === preset.url
                          ? "bg-amber-500 text-black border-amber-400 scale-105"
                          : "bg-zinc-800 text-zinc-400 hover:text-white border-zinc-700"
                      }`}>
                      {preset.label}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={submitVideo} disabled={isSubmittingVideo}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-amber-500 text-black mt-1 disabled:opacity-50">
                  {isSubmittingVideo ? "שולח לעריכה…" : "🎬 צור סרטון ריקוד (AI)"}
                </button>
              </div>
              <div className="absolute top-3 left-3 flex gap-2 z-[3]">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.share) {
                      navigator.share({
                        title: "My AI Event Video",
                        url: typeof window !== "undefined" ? window.location.href : outputUrl,
                        text: "Check out my AI event video!",
                      }).catch(() => {});
                    } else {
                      window.open(outputUrl, "_blank");
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-violet-500 border border-violet-400 flex items-center justify-center hover:bg-violet-400 transition-colors"
                  title="Share Video"
                >
                  📤
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(outputUrl)}`} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-green-500 border border-green-400 flex items-center justify-center">📱</a>
                <a href={outputUrl} download target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-black/70 border border-zinc-600 flex items-center justify-center">⬇️</a>
              </div>
            </>
          ) : !isProcessing && (
            <div className="text-center pointer-events-none">
              <div className="text-5xl mb-3 opacity-10">✨</div>
              <p className="text-zinc-600 text-xs uppercase">ממתין לתמונה שלך</p>
            </div>
          )}

          {latency !== null && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/90 border border-amber-500/25 z-[3]" dir="ltr">
              <span className="text-amber-300 text-xs font-mono font-bold">⏱ {latency.toFixed(2)}s</span>
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="w-full max-w-5xl mb-5 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50">
          <p className="text-[11px] text-zinc-400 font-bold mb-2">היסטוריית סשן (לחץ לחזרה לתמונה)</p>
          <div className="flex gap-2 overflow-x-auto pb-1" dir="ltr">
            {history.map((url, idx) => (
              <img key={idx} src={url} alt="hist" onClick={() => setOutputUrl(url)}
                className={`w-14 h-14 object-cover rounded-lg cursor-pointer transition-all ${outputUrl === url ? "ring-2 ring-violet-500" : "opacity-60"}`} />
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl mb-5">
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
          disabled={isProcessing} rows={3}
          placeholder="מה תרצה להיות היום? לדוגמה: סופרמן עם גוף שלם, תאורה קולנועית..."
          className="w-full px-5 py-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-white text-sm focus:outline-none focus:border-violet-600 transition-all resize-none" />
      </div>

      <div className="w-full max-w-5xl mb-5">
        <p className="text-[11px] text-zinc-500 font-bold mb-2 px-1">בחר מודל עיבוד</p>
        <div className="flex flex-wrap gap-2">
          {MODEL_OPTIONS.map((opt) => (
            <button key={opt.id} type="button" onClick={() => setSelectedModel(opt.modelId)} disabled={isProcessing}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border ${
                selectedModel === opt.modelId ? "bg-violet-600 border-violet-500 text-white" : "bg-zinc-900/70 border-zinc-800 text-zinc-400"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-5xl flex flex-col gap-4 items-center mb-6">
        {inputMode === "camera" ? (
          !cameraActive ? (
            <button type="button" onClick={startCamera}
              className="px-16 py-4 rounded-2xl font-black text-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-900">
              📷 הפעל מצלמה
            </button>
          ) : (
            <button type="button" onClick={runTransform}
              disabled={!capturedImage || !prompt.trim() || isProcessing}
              className="px-16 py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 shadow-2xl disabled:opacity-35 disabled:cursor-not-allowed">
              {isProcessing ? "מעבד קסם…" : capturedImage ? "✨ הפעל AI עכשיו" : "📷 צלם תמונה קודם"}
            </button>
          )
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || !prompt.trim()}
            className="px-16 py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-pink-600 via-fuchsia-500 to-violet-600 shadow-2xl disabled:opacity-35 disabled:cursor-not-allowed">
            {isProcessing ? "מעבד קסם…" : "🖼️ העלה והפעל"}
          </button>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {error && (
        <div className="mt-5 w-full max-w-5xl px-5 py-4 rounded-xl bg-red-950/40 border border-red-900/50 text-red-200 text-sm">
          ⚠️ {error}
        </div>
      )}
    </main>
  );
}

import type { BarberSkinMedia } from "@/lib/barber-skins";

export function SkinBackdrop({
  media,
  className = "",
}: {
  media: BarberSkinMedia;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {media.type === "video" && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={media.poster}
          className="h-full w-full object-cover"
          style={{ objectPosition: media.objectPosition ?? "center" }}
        >
          <source src={media.src} />
        </video>
      )}

      {media.type === "image" && (
        <img
          src={media.src}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: media.objectPosition ?? "center" }}
        />
      )}

      {media.overlay && (
        <div
          className="absolute inset-0"
          style={{ background: media.overlay }}
        />
      )}
    </div>
  );
}

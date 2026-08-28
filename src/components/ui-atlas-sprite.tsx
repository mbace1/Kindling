import { assetSrc } from "@/lib/kindling/model";

const ATLAS_W = 1122;
const ATLAS_H = 1402;

export function UiAtlasSprite({
  x,
  y,
  width,
  height,
  displayWidth,
  className,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  displayWidth: number;
  className?: string;
}) {
  const scale = displayWidth / width;
  return (
    <span
      aria-hidden="true"
      className={`relative block shrink-0 overflow-hidden ${className ?? ""}`}
      style={{ width: displayWidth, height: Math.round(height * scale) }}
    >
      <img
        src={assetSrc("art/ui/ui-kit.png")}
        alt=""
        className="pointer-events-none absolute max-w-none select-none [image-rendering:pixelated]"
        style={{
          width: ATLAS_W * scale,
          height: ATLAS_H * scale,
          left: -x * scale,
          top: -y * scale,
        }}
      />
    </span>
  );
}

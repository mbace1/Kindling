import type { CSSProperties } from "react";
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
  displayHeight,
  style,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  displayWidth: number;
  className?: string;
  displayHeight?: number;
  style?: CSSProperties;
}) {
  const scaleX = displayWidth / width;
  const scaleY = (displayHeight ?? (height * scaleX)) / height;
  return (
    <span
      aria-hidden="true"
      className={`relative block shrink-0 overflow-hidden ${className ?? ""}`}
      style={{ width: displayWidth, height: Math.round(height * scaleY), ...style }}
    >
      <img
        src={assetSrc("art/ui/ui-kit.png")}
        alt=""
        className="pointer-events-none absolute max-w-none select-none [image-rendering:pixelated]"
        style={{
          width: ATLAS_W * scaleX,
          height: ATLAS_H * scaleY,
          left: -x * scaleX,
          top: -y * scaleY,
        }}
      />
    </span>
  );
}



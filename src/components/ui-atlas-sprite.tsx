import type { CSSProperties, ReactNode } from "react";
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


function PanelPiece({
  x,
  y,
  width,
  height,
  className,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  className: string;
}) {
  return (
    <span className={`pointer-events-none absolute overflow-hidden ${className}`} aria-hidden="true">
      <UiAtlasSprite
        x={x}
        y={y}
        width={width}
        height={height}
        displayWidth={width}
        displayHeight={height}
        className="h-full w-full"
      />
    </span>
  );
}

export function UiAtlasPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-stone/75 ${className ?? ""}`}>
      <PanelPiece x={10} y={1142} width={18} height={18} className="left-0 top-0 size-[18px]" />
      <PanelPiece x={127} y={1142} width={18} height={18} className="right-0 top-0 size-[18px]" />
      <PanelPiece x={10} y={1258} width={18} height={18} className="bottom-0 left-0 size-[18px]" />
      <PanelPiece x={127} y={1258} width={18} height={18} className="bottom-0 right-0 size-[18px]" />

      <span className="pointer-events-none absolute inset-x-[18px] top-0 h-[18px] overflow-hidden" aria-hidden="true">
        <UiAtlasSprite x={28} y={1142} width={99} height={18} displayWidth={99} displayHeight={18} className="h-full w-full" />
      </span>
      <span className="pointer-events-none absolute inset-x-[18px] bottom-0 h-[18px] overflow-hidden" aria-hidden="true">
        <UiAtlasSprite x={28} y={1258} width={99} height={18} displayWidth={99} displayHeight={18} className="h-full w-full" />
      </span>
      <span className="pointer-events-none absolute bottom-[18px] left-0 top-[18px] w-[18px] overflow-hidden" aria-hidden="true">
        <UiAtlasSprite x={10} y={1160} width={18} height={98} displayWidth={18} displayHeight={98} className="h-full w-full" />
      </span>
      <span className="pointer-events-none absolute bottom-[18px] right-0 top-[18px] w-[18px] overflow-hidden" aria-hidden="true">
        <UiAtlasSprite x={127} y={1160} width={18} height={98} displayWidth={18} displayHeight={98} className="h-full w-full" />
      </span>

      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

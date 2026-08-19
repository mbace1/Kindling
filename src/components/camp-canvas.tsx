import { useEffect, useRef } from "react";
import { portraitSrc, spriteSrc, warningState, warmth, type KindlingSave, type SpeciesId } from "@/lib/kindling/model";

type Props = {
  save: KindlingSave;
  tall?: boolean;
};

function load(src: string) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  return img;
}

const sheets = new Map<string, HTMLImageElement>();
function sheet(id: SpeciesId) {
  const src = spriteSrc(id);
  let img = sheets.get(src);
  if (!img) {
    img = load(src);
    sheets.set(src, img);
  }
  return img;
}

export function CampCanvas({ save, tall }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const camp = load("/art/camp.jpg");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    let t = 0;
    const sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = [];

    const draw = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!reduced) t += dt;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      ctx.fillStyle = "#0c1016";
      ctx.fillRect(0, 0, w, h);

      if (camp.complete && camp.naturalWidth) {
        const scale = Math.max(w / camp.naturalWidth, h / camp.naturalHeight);
        const dw = camp.naturalWidth * scale;
        const dh = camp.naturalHeight * scale;
        ctx.drawImage(camp, (w - dw) / 2, (h - dh) / 2, dw, dh);
      }

      const heat = warmth(save);
      const warn = warningState(save);
      const fx = w * 0.33;
      const fy = h * 0.60;

      if (warn) {
        ctx.fillStyle = "rgba(12, 16, 22, 0.28)";
        ctx.fillRect(0, 0, w, h);
      }

      drawFire(ctx, fx, fy, heat, t, reduced);
      if (save.kindlingPending || save.awaitingHatch) {
        drawAshMark(ctx, fx, fy + 10, t);
      }

      if (save.companion) {
        const near = warn ? 0.14 : 0.24;
        const cx = fx + w * near;
        const cy = fy + h * 0.06;
        drawCompanion(ctx, save.companion.species, cx, cy, t, reduced, heat);
      }

      if (!reduced && heat > 0.05) {
        if (Math.random() < heat * 0.35) {
          sparks.push({
            x: fx + (Math.random() - 0.5) * 18,
            y: fy - 8,
            vx: (Math.random() - 0.5) * 12,
            vy: -20 - Math.random() * 30,
            life: 0.8 + Math.random() * 0.6,
          });
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.life -= dt;
          if (s.life <= 0) sparks.splice(i, 1);
          else {
            ctx.fillStyle = `rgba(255, 122, 42, ${s.life})`;
            ctx.fillRect(s.x, s.y, 2, 2);
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [save]);

  return (
    <canvas
      ref={ref}
      className={tall ? "h-[52vh] min-h-72 w-full" : "h-56 w-full sm:h-72"}
      aria-label={save.companion ? `${save.companion.name} by the bonfire` : "The bonfire"}
    />
  );
}

function drawFire(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  heat: number,
  t: number,
  reduced: boolean,
) {
  const flicker = reduced ? 1 : 0.88 + Math.sin(t * 7) * 0.08 + Math.sin(t * 13) * 0.04;
  const h = 18 + heat * 56 * flicker;
  const w = 16 + heat * 22;

  ctx.fillStyle = "#3a2218";
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 5; i++) {
    const on = heat >= (i + 0.15) / 5;
    ctx.fillStyle = on ? "#c44a1a" : "#2a1812";
    ctx.fillRect(x - 14 + i * 6, y + 4, 5, 4);
  }

  if (heat <= 0.02) {
    ctx.fillStyle = "rgba(196, 74, 26, 0.45)";
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const grad = ctx.createRadialGradient(x, y, 2, x, y - h * 0.3, h);
  grad.addColorStop(0, "rgba(232, 224, 212, 0.95)");
  grad.addColorStop(0.25, "rgba(255, 122, 42, 0.9)");
  grad.addColorStop(0.7, "rgba(196, 74, 26, 0.45)");
  grad.addColorStop(1, "rgba(196, 74, 26, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.15, y + 4);
  ctx.quadraticCurveTo(x - w, y - h * 0.3, x - 2, y - h);
  ctx.quadraticCurveTo(x + w * 0.2, y - h * 0.55, x + 4, y - h * 0.85);
  ctx.quadraticCurveTo(x + w, y - h * 0.25, x + w * 0.2, y + 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(232, 224, 212, 0.55)";
  ctx.beginPath();
  ctx.ellipse(x, y - h * 0.15, 4 + heat * 3, 8 + heat * 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawAshMark(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.fillStyle = "#8ea0b8";
  ctx.beginPath();
  ctx.arc(x + Math.sin(t) * 1, y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff7a2a";
  ctx.fillRect(x - 1, y - 1, 2, 2);
}

function drawCompanion(
  ctx: CanvasRenderingContext2D,
  id: SpeciesId,
  x: number,
  y: number,
  t: number,
  reduced: boolean,
  heat: number,
) {
  const img = sheet(id);
  const frame = reduced ? 0 : Math.floor(t * 3) % 4;
  const col = frame % 2;
  const row = Math.floor(frame / 2);
  const size = id === "mossknight" ? 132 : id === "ashling" ? 100 : 112;
  const bob = reduced ? 0 : Math.sin(t * 2.2) * 2;
  const glow = 0.18 + heat * 0.28;
  ctx.save();
  ctx.fillStyle = "rgba(8, 10, 14, 0.45)";
  ctx.beginPath();
  ctx.ellipse(x, y + 4, size * 0.28, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = `rgba(255, 122, 42, ${glow})`;
  ctx.shadowBlur = 16;
  if (img.complete && img.naturalWidth) {
    const cw = img.naturalWidth / 2;
    const ch = img.naturalHeight / 2;
    ctx.drawImage(img, col * cw, row * ch, cw, ch, x - size / 2, y - size + bob, size, size);
  } else {
    const p = load(portraitSrc(id));
    if (p.complete && p.naturalWidth) {
      ctx.drawImage(p, x - size / 2, y - size + bob, size, size);
    }
  }
  ctx.restore();
}

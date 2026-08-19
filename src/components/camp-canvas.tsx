import { useEffect, useRef } from "react";
import { assetSrc, portraitSrc, spriteSrc, warningState, warmth, type KindlingSave, type SpeciesId } from "@/lib/kindling/model";

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

    const camp = load(assetSrc("art/camp.jpg"));
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

      ctx.fillStyle = "#0c1016";
      ctx.fillRect(0, 0, w, h);

      // The Grok camp is a detailed painted/crafted source, not the old 320x180
      // quantised cabinet art. Let the browser scale the background smoothly;
      // creature frames below keep their own hard silhouette.
      ctx.imageSmoothingEnabled = true;
      if (camp.complete && camp.naturalWidth) {
        const scale = Math.max(w / camp.naturalWidth, h / camp.naturalHeight);
        const dw = camp.naturalWidth * scale;
        const dh = camp.naturalHeight * scale;
        ctx.drawImage(camp, (w - dw) / 2, (h - dh) / 2, dw, dh);
      }

      const heat = warmth(save);
      const warn = warningState(save);
      // Approved staging: companion on the left, bonfire just to its right,
      // ruin mass behind them, with the composition opening toward the path.
      const fx = w * 0.36;
      const fy = h * 0.61;

      if (warn) {
        ctx.fillStyle = "rgba(7, 10, 16, 0.34)";
        ctx.fillRect(0, 0, w, h);
      }

      drawFire(ctx, fx, fy, heat, t, reduced);
      if (save.kindlingPending || save.awaitingHatch) {
        drawAshMark(ctx, fx, fy + 10, t);
      }

      // Away means away. The active companion cannot also be visibly sitting at
      // camp while their Journey or encounter is still running.
      if (save.companion && !save.walk && !save.combat) {
        // On the warning day they edge closer to the coals; otherwise they keep
        // enough space that both silhouettes read independently at phone size.
        const distance = warn ? 0.11 : 0.18;
        const cx = fx - w * distance;
        const cy = fy + h * 0.07;
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

      // Subtle edge falloff keeps the centre-left relationship readable without
      // painting another object into the source art.
      const vignette = ctx.createRadialGradient(w * 0.42, h * 0.5, h * 0.2, w * 0.5, h * 0.55, Math.max(w, h) * 0.72);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(3,6,10,0.26)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [save]);

  return (
    <canvas
      ref={ref}
      className={tall ? "h-[52vh] min-h-72 w-full" : "h-56 w-full sm:h-72"}
      aria-label={save.companion && !save.walk && !save.combat ? `${save.companion.name} by the bonfire` : "The bonfire"}
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
  const flicker = reduced ? 1 : 0.92 + Math.sin(t * 7) * 0.06 + Math.sin(t * 13) * 0.03;
  const h = 14 + heat * 54 * flicker;
  const w = 12 + heat * 20;

  // Keep the stone/log footprint low and dark. The source background already
  // supplies the large ring; these shapes are only the live coals on top of it.
  ctx.fillStyle = "rgba(24, 14, 10, 0.72)";
  ctx.beginPath();
  ctx.ellipse(x, y + 7, 17, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 5; i++) {
    const on = heat >= (i + 0.15) / 5;
    ctx.fillStyle = on ? "#b8441b" : "#241510";
    ctx.fillRect(x - 12 + i * 5, y + 3, 4, 3);
  }

  if (heat <= 0.02) {
    ctx.fillStyle = "rgba(196, 74, 26, 0.42)";
    ctx.fillRect(x - 5, y + 1, 10, 2);
    return;
  }

  // Glow is atmosphere only. The flame itself is three pointed silhouettes so
  // even 1/5 reads as FIRE rather than a radial-gradient orange egg.
  const glow = ctx.createRadialGradient(x, y - h * 0.25, 2, x, y - h * 0.25, h * 1.05);
  glow.addColorStop(0, `rgba(255, 122, 42, ${0.14 + heat * 0.12})`);
  glow.addColorStop(1, "rgba(255, 122, 42, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - h, y - h * 1.3, h * 2, h * 1.7);

  const tongue = (cx: number, baseY: number, width: number, height: number, lean: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.52, baseY);
    ctx.quadraticCurveTo(cx - width * 0.72, baseY - height * 0.38, cx + lean, baseY - height);
    ctx.quadraticCurveTo(cx + width * 0.68, baseY - height * 0.36, cx + width * 0.52, baseY);
    ctx.quadraticCurveTo(cx, baseY - height * 0.08, cx - width * 0.52, baseY);
    ctx.closePath();
    ctx.fill();
  };

  const sway = reduced ? 0 : Math.sin(t * 8.5) * 2;
  tongue(x - w * 0.18, y + 4, w * 0.7, h * 0.72, -2 + sway, "rgba(177, 55, 20, 0.95)");
  tongue(x + w * 0.18, y + 4, w * 0.62, h, 2 - sway * 0.6, "rgba(229, 79, 22, 0.97)");
  tongue(x, y + 3, w * 0.38, h * 0.62, sway * 0.25, "rgba(255, 160, 48, 0.98)");
  tongue(x + 1, y + 3, w * 0.18, h * 0.38, 0, "rgba(247, 219, 148, 0.96)");
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
  ctx.imageSmoothingEnabled = false;
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
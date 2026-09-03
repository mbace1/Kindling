import { useState } from "react";
import { CompanionAtlasSprite } from "@/components/ember-atlas-sprite";
import { COMPANION_ANIMATIONS, type CompanionAtlasMode } from "@/lib/kindling/companion-animation";
import { SPECIES, atlasSrc, type SpeciesId } from "@/lib/kindling/model";

const MODES: CompanionAtlasMode[] = ["walk", "happy", "low", "warm", "sleep", "curious", "hit", "victory"];
const SPECIES_IDS = Object.keys(COMPANION_ANIMATIONS) as SpeciesId[];

export function SpriteInspector() {
  const [mode, setMode] = useState<CompanionAtlasMode>("walk");
  return (
    <main className="min-h-dvh bg-night p-4 pb-12 text-bone" data-sprite-inspector>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.2em] text-fire">Dev tool</p>
        <h1 className="mt-1 font-display text-3xl">Companion Sprite Inspector</h1>
        <p className="mt-2 text-sm text-mute">Every runtime atlas uses the same 8×2 contract. Inspect raw cells and named animation states before shipping.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {MODES.map((id) => (
            <button key={id} type="button" onClick={() => setMode(id)} className={`rounded-md border px-3 py-2 text-xs ${mode === id ? "border-fire text-fire" : "border-ash text-mute"}`}>{id}</button>
          ))}
        </div>

        <div className="mt-6 grid gap-5">
          {SPECIES_IDS.map((species) => {
            const spec = COMPANION_ANIMATIONS[species];
            return (
              <section key={species} className="rounded-xl border border-ash bg-stone/80 p-4" data-inspector-species={species}>
                <div className="flex items-center justify-between gap-3">
                  <div><h2 className="font-display text-xl">{SPECIES[species].name}</h2><p className="text-xs text-mute">{spec.cols}×{spec.rows} · {spec.smoothing ? "smooth" : "pixelated"}</p></div>
                  <CompanionAtlasSprite species={species} mode={mode} className="h-20 w-20" />
                </div>
                <div className="mt-4 grid grid-cols-8 gap-1 rounded-md bg-night p-2" data-frame-grid={species}>
                  {Array.from({ length: spec.cols * spec.rows }, (_, frame) => {
                    const col = frame % spec.cols;
                    const row = Math.floor(frame / spec.cols);
                    return <div key={frame} className="relative aspect-square overflow-hidden border border-bone/10 bg-coal" title={`${species} frame ${frame}`}><span className="absolute inset-0 bg-no-repeat" style={{ backgroundImage: `url(${atlasSrc(species)})`, backgroundSize: `${spec.cols * 100}% ${spec.rows * 100}%`, backgroundPosition: `${(col / (spec.cols - 1)) * 100}% ${(row / (spec.rows - 1)) * 100}%`, imageRendering: spec.smoothing ? "auto" : "pixelated" }} /><span className="absolute bottom-0 right-0 bg-night/80 px-1 text-[9px] text-mute">{frame}</span></div>;
                  })}
                </div>
                <p className="mt-2 break-all text-[10px] text-mute">{atlasSrc(species)}</p>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

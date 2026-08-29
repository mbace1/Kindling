import { Flame, Footprints } from "lucide-react";
import { useKindling } from "@/lib/kindling/store";
import { formatDay, portraitSrc } from "@/lib/kindling/model";
import { EmberAtlasSprite } from "@/components/ember-atlas-sprite";

export function PackResponsive() {
  const s = useKindling();
  const latest = s.found[0];
  const homecoming = Boolean(latest && s.lastToast?.includes("came home with"));

  if (!latest) {
    return (
      <div className="px-5 py-10">
        <h2 className="font-display text-2xl">Pack</h2>
        <p className="mt-2 text-sm text-mute">Journeys leave small things. The pack is empty for now.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-28 pt-4">
      {homecoming ? (
        <section className="mb-6 overflow-hidden rounded-xl border border-fire/35 bg-coal">
          <div className="flex min-h-44 items-end justify-between gap-4 px-4 pt-4">
            <div className="pb-4">
              <p className="text-xs uppercase tracking-[0.18em] text-fire">Home again</p>
              <h2 className="mt-1 font-display text-3xl font-semibold leading-tight">
                {s.companion?.name ?? "Your companion"} brought something back.
              </h2>
              <div className="mt-4 rounded-lg border border-bone/10 bg-night/45 p-3">
                <p className="text-xs uppercase tracking-wide text-mute">{latest.kind}</p>
                <p className="font-display text-xl text-bone">{latest.name}</p>
                <p className="mt-1 text-xs text-mute">From the road · {formatDay(latest.date)}</p>
              </div>
            </div>
            {s.companion ? (
              s.companion.species === "ember" ? (
                <div className="relative mb-1 h-32 w-28 shrink-0">
                  <div className="absolute inset-x-3 bottom-0 h-4 rounded-full bg-night/55 blur-sm" />
                  <EmberAtlasSprite mode="happy" className="absolute bottom-0 left-1/2 h-28 w-28 -translate-x-1/2 drop-shadow-[0_8px_5px_rgba(0,0,0,0.35)]" />
                  <span className="absolute right-1 top-2 text-lg text-fire animate-bounce" aria-hidden="true">♥</span>
                </div>
              ) : (
                <img
                  src={portraitSrc(s.companion.species)}
                  alt=""
                  className="h-32 w-28 shrink-0 object-contain object-bottom drop-shadow-[0_8px_5px_rgba(0,0,0,0.35)]"
                />
              )
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-bone/10 p-3">
            <button
              type="button"
              onClick={() => s.setTab("today")}
              className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-fire px-3 font-medium text-night"
            >
              <Flame className="size-4" /> Back to the fire
            </button>
            <button
              type="button"
              onClick={() => s.setTab("journey")}
              className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-bone/15 bg-night/45 px-3 text-sm"
            >
              <Footprints className="size-4" /> Roads
            </button>
          </div>
        </section>
      ) : null}

      <h2 className="font-display text-2xl font-semibold">Pack</h2>
      <p className="text-sm text-mute">{s.found.length} brought home</p>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {s.found.map((item, index) => (
          <li
            key={item.id}
            className={index === 0 ? "rounded-md border border-fire/30 bg-coal p-3" : "rounded-md border border-ash bg-stone p-3"}
          >
            <p className="text-xs uppercase tracking-wide text-mute">{item.kind}</p>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-mute">{formatDay(item.date)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

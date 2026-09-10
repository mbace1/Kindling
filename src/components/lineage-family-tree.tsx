import { cn } from "@/lib/utils";
import { formatDay, portraitSrc, type KindlingSave } from "@/lib/kindling/model";
import { ashTraitLabel, ashTraitSummary, buildFamilyRoster } from "@/lib/kindling/lineage";

type Props = {
  save: Pick<KindlingSave, "roster" | "companion" | "egg" | "lineage">;
  onSelectLiving?: (id: string) => void;
};

export function LineageFamilyTree({ save, onSelectLiving }: Props) {
  const { living, egg, kindled } = buildFamilyRoster(save);
  const empty = living.length === 0 && !egg && kindled.length === 0;

  if (empty) {
    return (
      <p className="text-sm text-mute sm:mt-2">
        No Kindled names yet. Combine leaves parents by the fire; lineage remembers who became Kindling.
      </p>
    );
  }

  return (
    <div className="space-y-4 sm:mt-3" aria-label="Firelit family tree">
      <p className="text-sm text-mute">
        A living family on the road — pack by the coals, egg in the warmth, Kindled names still glowing.
      </p>

      <div className="rounded-xl border border-fire/25 bg-gradient-to-b from-coal/80 to-night/60 p-3 shadow-[0_0_28px_rgba(232,140,48,0.08)]">
        <p className="text-[10px] uppercase tracking-[0.18em] text-fire">By the fire</p>
        <ul className="mt-2 space-y-2">
          {living.map((node) => (
            <li key={node.key}>
              <button
                type="button"
                disabled={!onSelectLiving}
                onClick={() => onSelectLiving?.(node.key)}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left",
                  node.active ? "border-fire/55 bg-night/80" : "border-ash/70 bg-stone/70",
                  onSelectLiving && "hover:border-fire/40",
                )}
              >
                <span className="relative">
                  <img src={portraitSrc(node.species)} alt="" className="h-12 w-12 object-contain" />
                  {node.active ? (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-fire shadow-[0_0_8px_rgba(232,140,48,0.9)]" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{node.name}</span>
                  <span className="block text-xs text-mute">
                    {node.stageLabel}
                    {typeof node.bondXp === "number" ? ` · ${node.bondXp} Bond` : ""}
                    {node.active ? " · walking" : ""}
                  </span>
                  {node.parentLine ? <span className="mt-0.5 block text-xs text-fire/80">{node.parentLine}</span> : null}
                  {node.trait ? (
                    <span className="mt-0.5 block text-xs text-fire" title={ashTraitSummary(node.trait) ?? undefined}>
                      Carries {ashTraitLabel(node.trait) ?? node.trait}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {egg ? (
          <div className="relative mt-3 rounded-lg border border-fire/35 bg-night/70 px-3 py-3">
            <div className="pointer-events-none absolute inset-x-8 -top-2 h-px bg-gradient-to-r from-transparent via-fire/50 to-transparent" />
            <p className="text-[10px] uppercase tracking-[0.16em] text-fire">Warming in the coals</p>
            <div className="mt-1 flex items-center gap-3">
              <img src={portraitSrc(egg.species)} alt="" className="h-12 w-12 object-contain opacity-80" />
              <div>
                <p className="font-medium">{egg.name}</p>
                <p className="text-xs text-mute">{egg.parentLine}</p>
                {egg.trait ? (
                  <p className="mt-0.5 text-xs text-fire">
                    Will inherit {ashTraitLabel(egg.trait) ?? egg.trait}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {kindled.length ? (
        <div className="rounded-xl border border-fire/15 bg-coal/40 p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-fire/90">Kindled family</p>
          <p className="mt-1 text-xs text-mute">Still part of the fire — remembered, never scolded away.</p>
          <ul className="mt-2 space-y-2">
            {kindled.map((node, index) => (
              <li
                key={node.key}
                className="flex items-center gap-3 rounded-lg border border-fire/20 bg-night/50 px-3 py-2"
                style={{ boxShadow: `inset 0 0 ${10 + index * 2}px rgba(232,140,48,0.06)` }}
              >
                <span className="relative">
                  <img
                    src={portraitSrc(node.species)}
                    alt=""
                    className="h-12 w-12 object-contain"
                    style={{ filter: "sepia(0.35) saturate(1.1) brightness(0.92)" }}
                  />
                  <span className="absolute inset-0 rounded-full bg-fire/10 blur-[6px]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{node.name}</p>
                  <p className="text-xs text-mute">
                    Kindled {node.kindledOn ? formatDay(node.kindledOn) : "—"} · {node.stageLabel}
                    {typeof node.bondXp === "number" ? ` · ${node.bondXp} Bond XP` : ""}
                  </p>
                  {node.trait ? (
                    <p className="mt-0.5 text-xs text-fire/85" title={ashTraitSummary(node.trait) ?? undefined}>
                      Left {ashTraitLabel(node.trait) ?? node.trait} in the coals
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-mute">No Kindled names yet — the living pack still holds the night.</p>
      )}
    </div>
  );
}

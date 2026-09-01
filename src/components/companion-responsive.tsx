import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  SPECIES,
  bondUnits,
  eggReady,
  eggWarmth,
  formatDay,
  pairings,
  portraitSrc,
  stageOf,
  stageOfCompanion,
} from "@/lib/kindling/model";
import { journeyTraitForCompanion, nextJourneyTraitGrowth } from "@/lib/kindling/companion-journey";
import { useKindling } from "@/lib/kindling/store";
import { companionVisualState } from "@/lib/kindling/find-progression";
import { cn } from "@/lib/utils";
import { CompanionAtlasSprite } from "@/components/ember-atlas-sprite";

function traitEffects(trait: NonNullable<ReturnType<typeof journeyTraitForCompanion>>) {
  const effects: string[] = [];
  if (trait.investigateExtra) effects.push("Can uncover an extra material");
  if (trait.investigateTimeDelta < 0) effects.push(`Investigations ${Math.abs(trait.investigateTimeDelta) / 1000}s faster`);
  if (trait.restBondBonus > 0) effects.push(`+${trait.restBondBonus} Bond on Journey rests`);
  if (trait.restTimeDelta < 0) effects.push(`Rests ${Math.abs(trait.restTimeDelta) / 1000}s faster`);
  if (trait.shortcutTimeDelta < 0) effects.push(`Shortcuts ${Math.abs(trait.shortcutTimeDelta) / 1000}s faster`);
  if (trait.ambushMultiplier < 1) effects.push(`${Math.round((1 - trait.ambushMultiplier) * 100)}% less shortcut ambush risk`);
  if (trait.ambushGuard > 0) effects.push(`+${trait.ambushGuard} opening Guard in ambushes`);
  return effects;
}

export function CompanionResponsive() {
  const s = useKindling();
  const stage = stageOf(s);
  const [name, setName] = useState(s.companion?.name ?? "");
  const [rosterOpen, setRosterOpen] = useState(false);
  const [lineageOpen, setLineageOpen] = useState(false);
  const warmthNow = eggWarmth(s);
  const ready = eggReady(s);
  const maturePairs = useMemo(
    () => pairings(s.roster).filter((p) => bondUnits(p.a) >= 18 && bondUnits(p.b) >= 18),
    [s.roster],
  );

  useEffect(() => setName(s.companion?.name ?? ""), [s.companion?.id, s.companion?.name]);

  if (s.awaitingHatch) {
    return (
      <div className="space-y-4 px-4 pb-28 pt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-mute">The coals</p>
        <h2 className="font-display text-3xl font-semibold">Something small is waiting.</h2>
        <p className="text-sm text-mute">Choose who rises next. The last one stays in the lineage.</p>
        <div className="grid grid-cols-2 gap-3">
          {s.unlocked.map((id) => {
            const spec = SPECIES[id];
            return (
              <button key={id} type="button" onClick={() => s.hatch(id)} className="rounded-lg border border-ash bg-stone p-3 text-left">
                <img src={portraitSrc(id)} alt="" className="mx-auto h-24 w-24 object-contain" />
                <p className="mt-2 font-medium">{spec.name}</p>
                <p className="text-xs text-mute">{spec.blurb}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!s.companion) {
    return <div className="px-4 py-10 text-mute">No one is by the fire. The coals are still warm enough to hatch.</div>;
  }

  const pose = companionVisualState(s);
  const journeyTrait = journeyTraitForCompanion(s.companion);
  const nextTraitGrowth = nextJourneyTraitGrowth(s.companion);
  const journeyEffects = journeyTrait ? traitEffects(journeyTrait) : [];

  return (
    <div className="px-4 pb-28 pt-4">
      <section className="flex flex-col items-center rounded-xl border border-ash/70 bg-stone/50 px-4 pb-5 pt-4 sm:border-0 sm:bg-transparent">
        <CompanionAtlasSprite
          species={s.companion.species}
          mode={pose === "sleep" ? "warm" : pose}
          className="h-40 w-40 sm:h-44 sm:w-44"
        />
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-mute">{SPECIES[s.companion.species].name}</p>
        <h2 className="font-display text-3xl font-semibold">{s.companion.name}</h2>
        <p className="text-sm text-mute">{stage.name} · {s.companion.bondXp} Bond XP</p>
        <p className="mt-1 text-xs text-mute sm:text-sm">{s.encounters.wins} paths held · born {formatDay(s.companion.born)}</p>
        {s.companion.trait ? <p className="mt-1 text-sm text-fire">Carries {s.companion.trait}</p> : null}
      </section>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          s.rename(name);
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={22}
          aria-label="Companion name"
          className="min-h-12 flex-1 rounded-md border border-ash bg-night px-3 text-sm text-bone outline-none focus:border-mute"
        />
        <button type="submit" className="min-h-12 rounded-md border border-ash bg-stone px-4 text-sm">Name</button>
      </form>

      <p className="mt-4 text-sm text-mute">{SPECIES[s.companion.species].blurb}</p>
      <p className="mt-1 text-sm text-mute">{SPECIES[s.companion.species].combat.tendency.replace("-", " ")}</p>

      {journeyTrait ? (
        <section className="mt-6 rounded-lg border border-fire/30 bg-coal/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-mute">Journey trait</p>
              <h3 className="mt-1 font-display text-xl text-fire">{journeyTrait.name}</h3>
            </div>
            <span className="rounded-full border border-fire/25 px-2 py-1 text-xs text-fire">Rank {journeyTrait.rankLabel}</span>
          </div>
          <p className="mt-2 text-sm text-mute">{journeyTrait.summary}</p>
          <ul className="mt-3 grid gap-1.5 text-sm text-bone/85 sm:grid-cols-2">
            {journeyEffects.map((effect) => (
              <li key={effect} className="rounded-md border border-ash/60 bg-night/45 px-2.5 py-2">{effect}</li>
            ))}
          </ul>
          {nextTraitGrowth ? (
            <div className="mt-4 border-t border-ash/60 pt-3">
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="uppercase tracking-[0.15em] text-mute">Next growth · {nextTraitGrowth.stage}</span>
                <span className="text-fire">{nextTraitGrowth.remaining} Bond XP to go</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ash" aria-label={`${s.companion.bondXp} of ${nextTraitGrowth.bondXp} Bond XP`}>
                <div
                  className="h-full rounded-full bg-fire transition-[width]"
                  style={{ width: `${Math.min(100, Math.max(3, (s.companion.bondXp / nextTraitGrowth.bondXp) * 100))}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-mute">Reach {nextTraitGrowth.bondXp} Bond XP to strengthen this Journey trait.</p>
            </div>
          ) : (
            <p className="mt-4 border-t border-ash/60 pt-3 text-xs text-fire">Elder rank reached · this Journey trait is fully grown.</p>
          )}
        </section>
      ) : null}

      {s.egg ? (
        <section className="mt-6 rounded-lg border border-fire/35 bg-coal p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-mute">Ember Egg</p>
          <h3 className="mt-1 font-display text-xl">{SPECIES[s.egg.species].name}</h3>
          <p className="text-sm text-mute">From {s.egg.parentAName} + {s.egg.parentBName}</p>
          <div className="mt-3 flex gap-1.5" aria-label={`${warmthNow} of ${s.egg.required} warmth`}>
            {Array.from({ length: s.egg.required }).map((_, i) => (
              <span key={i} className={cn("h-2 flex-1 rounded-full", i < warmthNow ? "bg-fire" : "bg-ash")} />
            ))}
          </div>
          <p className="mt-2 text-sm text-mute">
            {ready ? "Warm enough to hatch whenever you are ready." : `${warmthNow} / ${s.egg.required} ordinary care actions warmed the egg.`}
          </p>
          {ready ? (
            <button type="button" onClick={() => s.hatchEgg()} className="mt-3 min-h-12 w-full rounded-md bg-fire px-4 font-medium text-night">Hatch</button>
          ) : null}
        </section>
      ) : null}

      {s.roster.length > 1 ? (
        <section className="mt-6">
          <button
            type="button"
            onClick={() => setRosterOpen((v) => !v)}
            aria-expanded={rosterOpen}
            className="flex min-h-12 w-full items-center justify-between rounded-lg border border-ash bg-stone px-4 text-left sm:hidden"
          >
            <span>
              <span className="block font-medium">By the fire</span>
              <span className="block text-xs text-mute">{s.roster.length} companions</span>
            </span>
            <ChevronDown className={cn("size-4 text-mute transition-transform", rosterOpen && "rotate-180")} />
          </button>
          <div className={cn("mt-3", !rosterOpen && "max-sm:hidden")}>
            <h3 className="hidden font-display text-xl sm:block">By the fire</h3>
            <p className="hidden text-sm text-mute sm:block">Who keeps tonight.</p>
            <ul className="space-y-2 sm:mt-3">
              {s.roster.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => s.switchCompanion(m.id)}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left",
                      m.id === s.companion?.id ? "border-fire/50 bg-coal" : "border-ash bg-stone",
                    )}
                  >
                    <img src={portraitSrc(m.species)} alt="" className="h-12 w-12 object-contain" />
                    <span className="flex-1">
                      <span className="block font-medium">{m.name}</span>
                      <span className="text-xs text-mute">{SPECIES[m.species].name} · {stageOfCompanion(m).name} · {m.bondXp} Bond</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {!s.egg && maturePairs.length > 0 && s.roster.length < 6 ? (
        <section className="mt-6 rounded-lg border border-ash bg-stone/60 p-3 sm:bg-transparent sm:p-0">
          <h3 className="font-display text-xl">Lineage</h3>
          <p className="text-sm text-mute">Two tender-or-older companions can leave an egg in the coals.</p>
          <ul className="mt-3 space-y-2">
            {maturePairs.map((p) => (
              <li key={p.a.id + p.b.id}>
                <button
                  type="button"
                  onClick={() => s.breed(p.a.id, p.b.id)}
                  className="flex min-h-14 w-full items-center justify-between rounded-md border border-ash bg-stone px-3 py-2 text-left"
                >
                  <span className="text-sm">{p.a.name} · {p.b.name}</span>
                  <span className="text-xs text-fire">Egg · {SPECIES[p.child].name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!s.egg && s.roster.length > 1 && maturePairs.length === 0 ? (
        <p className="mt-6 text-sm text-mute">Pairing opens when two companions have reached tender.</p>
      ) : null}

      <section className="mt-6">
        <button
          type="button"
          onClick={() => setLineageOpen((v) => !v)}
          aria-expanded={lineageOpen}
          className="flex min-h-12 w-full items-center justify-between rounded-lg border border-ash bg-stone px-4 text-left sm:hidden"
        >
          <span>
            <span className="block font-medium">Ancestors</span>
            <span className="block text-xs text-mute">{s.lineage.length ? `${s.lineage.length} remembered` : "None yet"}</span>
          </span>
          <ChevronDown className={cn("size-4 text-mute transition-transform", lineageOpen && "rotate-180")} />
        </button>
        <div className={cn("mt-3", !lineageOpen && "max-sm:hidden")}>
          <h3 className="hidden font-display text-xl sm:block">Ancestors</h3>
          {s.lineage.length === 0 ? (
            <p className="text-sm text-mute sm:mt-2">No ancestors yet. The fire has only been kept.</p>
          ) : (
            <ul className="space-y-2 sm:mt-3">
              {s.lineage.map((a) => (
                <li key={a.id} className="flex items-center gap-3 rounded-md border border-ash bg-stone px-3 py-2">
                  <img src={portraitSrc(a.species)} alt="" className="h-12 w-12 object-contain grayscale" />
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-mute">Kindled {formatDay(a.kindledOn)} · {a.stage} · {a.bondXp} Bond XP{a.trait ? ` · ${a.trait}` : ""}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
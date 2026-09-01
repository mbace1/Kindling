import { companionCombatGrowth, combatStatsForCompanion } from "@/lib/kindling/companion-combat";
import { SPECIES } from "@/lib/kindling/model";
import { useKindling } from "@/lib/kindling/store";

function bonusLabel(value: number) {
  return value > 0 ? `+${value}` : "—";
}

export function CompanionCombatGrowthPanel() {
  const s = useKindling();
  const companion = s.companion;
  if (!companion) return null;

  const growth = companionCombatGrowth(companion);
  const stats = combatStatsForCompanion(companion);
  const base = SPECIES[companion.species].combat;
  if (!growth || !stats) return null;

  const fullyGrown = growth.rank >= 4;
  const rows = [
    ["Vitality", stats.hp, growth.hpBonus],
    ["Strike", stats.strike, growth.strikeBonus],
    ["Guard", stats.guard, growth.guardBonus],
    ["Skill", stats.skill, growth.skillBonus],
    ["Speed", stats.speed, growth.speedBonus],
  ] as const;

  return (
    <section className="mx-4 mb-28 mt-[-5.5rem] rounded-lg border border-ash bg-stone/95 p-4 shadow-xl sm:mt-[-4rem]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-mute">Combat growth</p>
          <h3 className="mt-1 font-display text-xl">Bond-hardened {growth.rankLabel}</h3>
        </div>
        <span className="rounded-full border border-fire/25 px-2 py-1 text-xs text-fire">Rank {growth.rankLabel}</span>
      </div>

      <p className="mt-2 text-sm text-mute">
        The same Bond stages that strengthen Journey traits now harden {companion.name} in fights.
      </p>

      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {rows.map(([label, value, bonus]) => (
          <div key={label} className="rounded-md border border-ash/70 bg-night/55 px-1.5 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-mute">{label}</p>
            <p className="mt-1 text-base font-medium text-bone">{value}</p>
            <p className="text-[10px] text-fire">{bonusLabel(bonus)}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-mute">
        Base: {base.hp} Vitality · {base.strike} Strike · {base.guard} Guard · {base.skill} Skill · {base.speed} Speed
      </p>
      <p className="mt-1 text-xs text-fire">
        {fullyGrown ? "Elder combat growth reached." : "The next companion stage strengthens these combat bonuses again."}
      </p>
    </section>
  );
}

import { companionCombatGrowth, combatStatsForCompanion } from "@/lib/kindling/companion-combat";
import { SPECIES, nextStageBondXp } from "@/lib/kindling/model";
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
  const remaining = nextStageBondXp(s);
  const nextGrowth = fullyGrown || remaining <= 0
    ? null
    : companionCombatGrowth({ ...companion, bondXp: companion.bondXp + remaining });
  const rows = [
    ["Vitality", stats.hp, growth.hpBonus, nextGrowth ? nextGrowth.hpBonus - growth.hpBonus : 0],
    ["Strike", stats.strike, growth.strikeBonus, nextGrowth ? nextGrowth.strikeBonus - growth.strikeBonus : 0],
    ["Guard", stats.guard, growth.guardBonus, nextGrowth ? nextGrowth.guardBonus - growth.guardBonus : 0],
    ["Skill", stats.skill, growth.skillBonus, nextGrowth ? nextGrowth.skillBonus - growth.skillBonus : 0],
    ["Speed", stats.speed, growth.speedBonus, nextGrowth ? nextGrowth.speedBonus - growth.speedBonus : 0],
  ] as const;

  return (
    <section className="mx-4 mb-28 mt-4 overflow-hidden rounded-xl border border-fire/20 bg-gradient-to-b from-stone to-night p-4 shadow-[0_16px_50px_rgba(0,0,0,0.2)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-mute">Combat growth</p>
          <h3 className="mt-1 font-display text-xl">Bond-hardened {growth.rankLabel}</h3>
        </div>
        <span className="rounded-full border border-fire/25 bg-fire/5 px-2 py-1 text-xs text-fire">Rank {growth.rankLabel}</span>
      </div>

      <p className="mt-2 text-sm text-mute">Bond changes the numbers you actually carry into a fight.</p>

      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {rows.map(([label, value, bonus, next]) => (
          <div key={label} className="rounded-md border border-ash/70 bg-night/65 px-1.5 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-mute">{label}</p>
            <p className="mt-1 text-base font-medium text-bone">{value}</p>
            <p className="text-[10px] text-fire">{bonusLabel(bonus)}</p>
            {next > 0 ? <p className="mt-1 text-[9px] text-bone/50">next +{next}</p> : null}
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-mute">Base: {base.hp} Vitality · {base.strike} Strike · {base.guard} Guard · {base.skill} Skill · {base.speed} Speed</p>
      <p className="mt-1 text-xs text-fire">
        {fullyGrown ? "Elder combat growth reached." : `${remaining} Bond XP until the next combat growth.`}
      </p>
    </section>
  );
}

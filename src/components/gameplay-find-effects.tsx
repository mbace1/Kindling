import { useEffect, useRef, useState } from "react";
import { Flame, Footprints, Heart, X } from "lucide-react";
import { JourneyDecision } from "@/components/journey-decision";
import { COMBAT_ACTION_COPY, actionStat, intentCopy } from "@/components/combat-readability";
import { ERRAND_COST, FLAMES_PER_FUEL, SAVE_KEY, dayKey, progressiveOpportunities, stageOfCompanion } from "@/lib/kindling/model";
import { combatStatsForCompanion, companionCombatGrowth } from "@/lib/kindling/companion-combat";
import { journeyBondBonus, unlockedFindKinds } from "@/lib/kindling/find-progression";
import { useKindling } from "@/lib/kindling/store";
import { cn } from "@/lib/utils";

const LENS_MARK = "Glass Lens reads the danger. +2 Guard.";
const COMBAT_GROWTH_MARK = "Bond-hardened";
const CARE_COST = 1;
const CARE_BOND = 40;

function persistCurrent() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(useKindling.getState().snapshot()));
  } catch {
    /* local play continues even if persistence is unavailable */
  }
}

function counterTo(intent: "strike" | "guard" | "skill") {
  if (intent === "strike") return "guard";
  if (intent === "guard") return "skill";
  return "strike";
}

export function GameplayFindEffects() {
  const s = useKindling();
  const [choiceHidden, setChoiceHidden] = useState(false);
  const previousStage = useRef<string | null>(null);
  const hasLens = unlockedFindKinds(s).has("shard");
  const careMarker = `fire-care:${dayKey()}`;
  const caredWithFire = s.sheet.bonus.includes(careMarker);
  const hasProgressiveOpportunity = progressiveOpportunities(s).length > 0;
  const hasIncompleteCareTask = s.tasks.some((task) => !s.sheet.done.includes(task.id));

  useEffect(() => {
    setChoiceHidden(false);
  }, [s.sheet.date]);

  useEffect(() => {
    if (!s.hydrated || !s.companion) return;
    const stage = stageOfCompanion(s.companion);
    if (previousStage.current === null) {
      previousStage.current = stage.id;
      return;
    }
    if (previousStage.current === stage.id) return;
    previousStage.current = stage.id;
    useKindling.setState({
      lastToast: `${s.companion.name} grew into ${stage.name}. Journey and combat traits strengthened.`,
      updatedAt: Date.now(),
    });
    queueMicrotask(persistCurrent);
  }, [s.hydrated, s.companion?.id, s.companion?.bondXp]);

  useEffect(() => {
    if (!s.hydrated || !s.companion || !s.found.length) return;
    if (!s.lastToast?.includes("came home with")) return;

    const latest = s.found[0];
    const marker = `journey-bond:${latest.id}`;
    if (s.sheet.bonus.includes(marker)) return;

    const bonus = journeyBondBonus(s, latest.kind);
    if (bonus <= 0) return;

    const companion = { ...s.companion, bondXp: s.companion.bondXp + bonus };
    const roster = s.roster.map((member) => (member.id === companion.id ? companion : member));
    const sheet = { ...s.sheet, bonus: [...s.sheet.bonus, marker] };
    const updatedAt = Date.now();

    useKindling.setState({ companion, roster, sheet, updatedAt, lastToast: `${s.lastToast} · +${bonus} Bond XP` });
    queueMicrotask(persistCurrent);
  }, [s.hydrated, s.lastToast, s.found[0]?.id, s.companion?.id]);

  useEffect(() => {
    const combat = s.combat;
    const growth = companionCombatGrowth(s.companion);
    if (!s.hydrated || !combat || combat.result || !growth || growth.rank <= 0) return;
    if (combat.log.some((line) => line.startsWith(COMBAT_GROWTH_MARK))) return;

    const openingDamage = Math.min(growth.openingDamage, Math.max(0, combat.enemyHp - 1));
    useKindling.setState({
      combat: {
        ...combat,
        playerHp: combat.playerHp + growth.hpBonus,
        playerMax: combat.playerMax + growth.hpBonus,
        enemyHp: Math.max(1, combat.enemyHp - openingDamage),
        log: [`${COMBAT_GROWTH_MARK} ${growth.rankLabel} · +${growth.hpBonus} Vitality${openingDamage ? ` · ${openingDamage} opening pressure` : ""}.`, ...combat.log],
      },
      updatedAt: Date.now(),
    });
    queueMicrotask(persistCurrent);
  }, [s.hydrated, s.combat?.pathId, s.combat?.result, s.companion?.id, s.companion?.bondXp]);

  useEffect(() => {
    const combat = s.combat;
    if (!s.hydrated || !hasLens || !combat || combat.result) return;
    if (combat.log.includes(LENS_MARK)) return;

    useKindling.setState({
      combat: { ...combat, playerHp: combat.playerHp + 2, playerMax: combat.playerMax + 2, log: [LENS_MARK, ...combat.log] },
      updatedAt: Date.now(),
    });
    queueMicrotask(persistCurrent);
  }, [s.hydrated, hasLens, s.combat?.pathId, s.combat?.result]);

  const spendOnCompanion = () => {
    const current = useKindling.getState();
    if (!current.companion || current.fuel < CARE_COST || current.sheet.bonus.includes(careMarker)) return;
    const companion = { ...current.companion, bondXp: current.companion.bondXp + CARE_BOND };
    useKindling.setState({
      fuel: current.fuel - CARE_COST,
      companion,
      roster: current.roster.map((member) => (member.id === companion.id ? companion : member)),
      sheet: { ...current.sheet, bonus: [...current.sheet.bonus, careMarker] },
      updatedAt: Date.now(),
      lastToast: `−${CARE_COST * FLAMES_PER_FUEL} Flames · +${CARE_BOND} Bond XP`,
    });
    queueMicrotask(persistCurrent);
  };

  if (s.hydrated && s.tab === "journey" && s.combat && !s.combat.result && s.companion) {
    const stats = combatStatsForCompanion(s.companion);
    const growth = companionCombatGrowth(s.companion);
    const recommended = counterTo(s.combat.telegraph);
    if (stats) {
      return (
        <section className="fixed inset-x-3 top-20 z-30 mx-auto max-w-md overflow-hidden rounded-xl border border-fire/30 bg-gradient-to-b from-night/95 to-coal/95 p-3 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-fire">Enemy intent</p>
              <p className="mt-0.5 text-sm font-medium text-bone">{COMBAT_ACTION_COPY[s.combat.telegraph].title}</p>
              <p className="text-xs text-mute">{intentCopy(s.combat.telegraph)}</p>
            </div>
            {growth ? <span className="shrink-0 rounded-full border border-fire/25 bg-fire/5 px-2 py-1 text-xs text-fire">Combat {growth.rankLabel}</span> : null}
          </div>
          {growth ? (
            <div className="mt-2 rounded-md border border-fire/15 bg-coal/70 px-2.5 py-2">
              <p className="text-xs font-medium text-fire">{growth.identity}</p>
              <p className="text-[11px] leading-snug text-bone/65">{growth.identitySummary}</p>
            </div>
          ) : null}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["strike", "guard", "skill"] as const).map((verb) => {
              const isCounter = verb === recommended;
              return (
                <div key={verb} className={cn("relative rounded-md border px-2 py-2 text-center", isCounter ? "border-fire bg-fire/10" : "border-ash/70 bg-stone/75")}>
                  {isCounter ? <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-fire px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-night">Counter</span> : null}
                  <p className="text-xs font-medium text-bone">{COMBAT_ACTION_COPY[verb].title}</p>
                  <p className="mt-0.5 text-lg font-semibold text-fire">{actionStat(verb, stats)}</p>
                  <p className="text-[10px] leading-tight text-mute">{COMBAT_ACTION_COPY[verb].hint}</p>
                </div>
              );
            })}
          </div>
          {s.combat.log.length ? (
            <div className="mt-2 border-t border-ash/60 pt-2">
              <p className="text-[9px] uppercase tracking-[0.16em] text-mute">Latest exchange</p>
              <p className="mt-0.5 text-xs leading-snug text-bone/80">{s.combat.log[0]}</p>
            </div>
          ) : null}
        </section>
      );
    }
  }

  if (s.hydrated && s.tab === "journey" && s.walk) return <JourneyDecision startedAt={s.walk.startedAt} pathId={s.walk.pathId} />;

  const showChoice = s.hydrated && s.tab === "today" && !!s.companion && !s.egg && s.fuel >= CARE_COST && !choiceHidden && !caredWithFire && !hasProgressiveOpportunity && !hasIncompleteCareTask;
  if (!showChoice) return null;

  return (
    <section className="fixed inset-x-3 bottom-20 z-30 mx-auto max-w-md rounded-xl border border-fire/35 bg-night/95 p-3 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-fire"><Flame className="size-3.5" /> Spend the fire</p>
          <p className="mt-1 text-sm text-bone">Today’s care made Flames. What should they become?</p>
        </div>
        <button type="button" onClick={() => setChoiceHidden(true)} className="grid size-8 shrink-0 place-items-center rounded-full text-mute" aria-label="Keep the Flames for later"><X className="size-4" /></button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" disabled={s.fuel < ERRAND_COST} onClick={() => s.setTab("journey")} className="min-h-16 rounded-lg border border-ash bg-stone px-3 text-left disabled:opacity-40">
          <span className="flex items-center gap-1.5 text-sm font-medium"><Footprints className="size-4 text-fire" /> Journey</span>
          <span className="mt-1 block text-xs text-mute">{ERRAND_COST * FLAMES_PER_FUEL} Flames · finds + risk</span>
        </button>
        <button type="button" onClick={spendOnCompanion} className="min-h-16 rounded-lg border border-fire/40 bg-coal px-3 text-left">
          <span className="flex items-center gap-1.5 text-sm font-medium"><Heart className="size-4 text-fire" /> Stay by the fire</span>
          <span className="mt-1 block text-xs text-mute">{CARE_COST * FLAMES_PER_FUEL} Flames · +{CARE_BOND} Bond</span>
        </button>
      </div>
      <button type="button" onClick={() => setChoiceHidden(true)} className="mt-2 min-h-9 w-full text-xs text-mute">Save the Flames instead</button>
    </section>
  );
}

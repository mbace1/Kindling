import { useEffect, useState } from "react";
import { Flame, Footprints, Heart, X } from "lucide-react";
import { JourneyDecision } from "@/components/journey-decision";
import { ERRAND_COST, FLAMES_PER_FUEL, SAVE_KEY, dayKey } from "@/lib/kindling/model";
import { journeyBondBonus, unlockedFindKinds } from "@/lib/kindling/find-progression";
import { useKindling } from "@/lib/kindling/store";

const LENS_MARK = "Glass Lens reads the danger. +2 Guard.";
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

export function GameplayFindEffects() {
  const s = useKindling();
  const [choiceHidden, setChoiceHidden] = useState(false);
  const hasLens = unlockedFindKinds(s).has("shard");
  const careMarker = `fire-care:${dayKey()}`;
  const caredWithFire = s.sheet.bonus.includes(careMarker);

  useEffect(() => {
    setChoiceHidden(false);
  }, [s.sheet.date]);

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

    useKindling.setState({
      companion,
      roster,
      sheet,
      updatedAt,
      lastToast: `${s.lastToast} · +${bonus} Bond XP`,
    });
    queueMicrotask(persistCurrent);
  }, [s.hydrated, s.lastToast, s.found[0]?.id, s.companion?.id]);

  useEffect(() => {
    const combat = s.combat;
    if (!s.hydrated || !hasLens || !combat || combat.result) return;
    if (combat.log.includes(LENS_MARK)) return;

    useKindling.setState({
      combat: {
        ...combat,
        playerHp: combat.playerHp + 2,
        playerMax: combat.playerMax + 2,
        log: [LENS_MARK, ...combat.log],
      },
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

  if (s.hydrated && s.tab === "journey" && s.walk) {
    return <JourneyDecision startedAt={s.walk.startedAt} pathId={s.walk.pathId} />;
  }

  const showChoice = s.hydrated && s.tab === "today" && !!s.companion && s.fuel >= CARE_COST && !choiceHidden && !caredWithFire;
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

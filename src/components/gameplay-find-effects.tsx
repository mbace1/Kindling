import { useEffect } from "react";
import { SAVE_KEY } from "@/lib/kindling/model";
import { journeyBondBonus, unlockedFindKinds } from "@/lib/kindling/find-progression";
import { useKindling } from "@/lib/kindling/store";

const LENS_MARK = "Glass Lens reads the danger. +2 Guard.";

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
  const hasLens = unlockedFindKinds(s).has("shard");

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

  return null;
}

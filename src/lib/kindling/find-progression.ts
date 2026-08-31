import { builtCampKinds } from "./camp-construction";
import { FULL_DAY, caredToday, type FindKind, type KindlingSave } from "./model";

export type FindUpgrade = {
  kind: FindKind;
  name: string;
  effect: string;
};

export type CompanionVisualState = "low" | "warm" | "curious" | "happy" | "sleep";

export const FIND_UPGRADES: Record<FindKind, FindUpgrade> = {
  relic: {
    kind: "relic",
    name: "Waymarker",
    effect: "Known roads reveal what they may contain.",
  },
  shard: {
    kind: "shard",
    name: "Glass Lens",
    effect: "Journey danger is revealed. Encounters start with +2 Guard.",
  },
  moss: {
    kind: "moss",
    name: "Moss Bed",
    effect: "Coming home from a Journey gives +10 Bond XP.",
  },
  memory: {
    kind: "memory",
    name: "Story Stone",
    effect: "Memory finds give an extra +10 Bond XP and a camp reaction.",
  },
  ash: {
    kind: "ash",
    name: "Ember Bowl",
    effect: "Ash finds remain displayed beside the fire as a permanent hearth mark.",
  },
};

export function unlockedFindKinds(s: Pick<KindlingSave, "journal">) {
  return builtCampKinds(s);
}

export function unlockedFindUpgrades(s: Pick<KindlingSave, "journal">) {
  const kinds = builtCampKinds(s);
  return (Object.keys(FIND_UPGRADES) as FindKind[])
    .filter((kind) => kinds.has(kind))
    .map((kind) => FIND_UPGRADES[kind]);
}

export function journeyBondBonus(s: Pick<KindlingSave, "journal">, findKind: FindKind) {
  const kinds = builtCampKinds(s);
  return (kinds.has("moss") ? 10 : 0) + (findKind === "memory" && kinds.has("memory") ? 10 : 0);
}

export function companionVisualState(
  s: Pick<KindlingSave, "found" | "companion" | "sheet" | "tasks">,
): CompanionVisualState {
  if (!s.companion) return "sleep";
  const tended = caredToday(s as KindlingSave);
  const latest = s.found[0];
  if (latest?.kind === "relic" || latest?.kind === "shard" || latest?.kind === "memory") return "curious";
  if (tended >= FULL_DAY) return "happy";
  if (tended <= 1) return "low";
  return "warm";
}

export function companionFindReaction(s: Pick<KindlingSave, "found" | "companion">) {
  if (!s.companion || !s.found.length) return null;
  const newest = s.found[0];
  const reactions: Record<FindKind, string> = {
    relic: `${s.companion.name} keeps circling the ${newest.name.replace(/^a |^an /, "")}.`,
    shard: `${s.companion.name} watches firelight move through the ${newest.name.replace(/^a |^an /, "")}.`,
    moss: `${s.companion.name} has made a softer place beside the fire.`,
    memory: `${s.companion.name} stays quiet near ${newest.name}.`,
    ash: `${s.companion.name} nudges the ash closer to the warm stones.`,
  };
  return reactions[newest.kind];
}

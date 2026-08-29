import { type FindKind, type KindlingSave } from "./model";

export type FindUpgrade = {
  kind: FindKind;
  name: string;
  effect: string;
};

export const FIND_UPGRADES: Record<FindKind, FindUpgrade> = {
  relic: {
    kind: "relic",
    name: "Waymarker",
    effect: "Known roads now reveal what they may contain.",
  },
  shard: {
    kind: "shard",
    name: "Glass Lens",
    effect: "Journey cards reveal encounter risk.",
  },
  moss: {
    kind: "moss",
    name: "Moss Bed",
    effect: "Your companion settles closer to the fire after a journey.",
  },
  memory: {
    kind: "memory",
    name: "Story Stone",
    effect: "The newest memory gives your companion a camp reaction.",
  },
  ash: {
    kind: "ash",
    name: "Ember Bowl",
    effect: "Ash finds remain displayed beside the fire as a permanent hearth mark.",
  },
};

export function unlockedFindKinds(s: Pick<KindlingSave, "found">) {
  return new Set(s.found.map((item) => item.kind));
}

export function unlockedFindUpgrades(s: Pick<KindlingSave, "found">) {
  const kinds = unlockedFindKinds(s);
  return (Object.keys(FIND_UPGRADES) as FindKind[])
    .filter((kind) => kinds.has(kind))
    .map((kind) => FIND_UPGRADES[kind]);
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

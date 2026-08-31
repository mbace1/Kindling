import { FLAMES_PER_FUEL, type FindKind, type KindlingSave } from "./model";

export type CampBuild = {
  kind: FindKind;
  name: string;
  materialCount: number;
  flameCost: number;
  effect: string;
};

export const CAMP_BUILDS: Record<FindKind, CampBuild> = {
  relic: {
    kind: "relic",
    name: "Waymarker",
    materialCount: 2,
    flameCost: 20,
    effect: "Known roads reveal what they may contain.",
  },
  shard: {
    kind: "shard",
    name: "Glass Lens",
    materialCount: 1,
    flameCost: 40,
    effect: "Journey danger is revealed. Encounters start with +2 Guard.",
  },
  moss: {
    kind: "moss",
    name: "Moss Bed",
    materialCount: 1,
    flameCost: 20,
    effect: "Coming home from a Journey gives +10 Bond XP.",
  },
  memory: {
    kind: "memory",
    name: "Story Stone",
    materialCount: 1,
    flameCost: 20,
    effect: "Memory finds give an extra +10 Bond XP and a camp reaction.",
  },
  ash: {
    kind: "ash",
    name: "Ember Bowl",
    materialCount: 1,
    flameCost: 20,
    effect: "Ash finds remain displayed beside the fire as a permanent hearth mark.",
  },
};

const buildLine = (kind: FindKind) => `Built ${CAMP_BUILDS[kind].name}.`;

export function builtCampKinds(s: Pick<KindlingSave, "journal">) {
  const lines = s.journal.flatMap((entry) => entry.lines);
  return new Set(
    (Object.keys(CAMP_BUILDS) as FindKind[]).filter((kind) => lines.includes(buildLine(kind))),
  );
}

export function hasCampBuild(s: Pick<KindlingSave, "journal">, kind: FindKind) {
  return builtCampKinds(s).has(kind);
}

export function materialCount(s: Pick<KindlingSave, "found">, kind: FindKind) {
  return s.found.filter((item) => item.kind === kind).length;
}

export function canBuildCamp(s: Pick<KindlingSave, "found" | "journal" | "fuel">, kind: FindKind) {
  const build = CAMP_BUILDS[kind];
  return !hasCampBuild(s, kind)
    && materialCount(s, kind) >= build.materialCount
    && Math.round(s.fuel * FLAMES_PER_FUEL) >= build.flameCost;
}

export function availableCampBuilds(s: Pick<KindlingSave, "found" | "journal" | "fuel">) {
  return (Object.keys(CAMP_BUILDS) as FindKind[]).map((kind) => ({
    ...CAMP_BUILDS[kind],
    built: hasCampBuild(s, kind),
    materials: materialCount(s, kind),
    canBuild: canBuildCamp(s, kind),
  }));
}

export function campBuildJournalLine(kind: FindKind) {
  return buildLine(kind);
}

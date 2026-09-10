import { create } from "zustand";
import {
  ASH_TRAITS,
  EGG_WARMTH_REQUIRED,
  ERRAND_COST,
  FLAMES_PER_FUEL,
  PATHS,
  SAVE_KEY,
  SPECIES,
  type CombatVerb,
  type KindlingSave,
  type Mood,
  type SpeciesId,
  type Tab,
  applyRollover,
  bondUnits,
  caredToday,
  consecutiveMissed,
  dayKey,
  eggReady,
  recordRegionEcho,
  recordRegionMemory,
  freshCompanion,
  freshSave,
  grantBonus,
  journalEntry,
  liveStreak,
  nextProgressiveTier,
  normalizeSave,
  payOnce,
  PAY,
  prevKey,
  stageOf,
  warmth,
  offspringOf,
} from "./model";
import { combatStatsForCompanion } from "./companion-combat";
import { combatMove, exchangeHeadline } from "./combat-moves";
import {
  chargeIntentLine,
  combatAftermathCopy,
  enemyArchetype,
  nerveMaxFor,
  pickEnemyIntent,
  resolveDepthRound,
} from "./combat-depth";
import {
  ensureRivalLooming,
  pickRivalIntent,
  rivalAftermathCopy,
  rivalById,
  rivalForPath,
  rivalPhaseHp,
  rivalPressureSoftened,
  setRivalStatus,
  shouldMeetRival,
  type RoadRival,
} from "./combat-rivals";
import { playHit, playTick, unlockAudio } from "./audio";
import { oldGateReady, oldGateVisible, pathCleared } from "./world";

const WALK_DURATION_MS = 90_000;

type KindlingStore = KindlingSave & {
  hydrated: boolean;
  tab: Tab;
  breatheOpen: boolean;
  editingGoals: boolean;
  lastToast: string | null;
  hydrate: (incoming?: KindlingSave | null) => void;
  setTab: (tab: Tab) => void;
  toggleTask: (id: string) => void;
  completeProgressive: (taskId: string) => void;
  setMood: (mood: Mood) => void;
  countBreath: () => void;
  addTask: (text: string, category?: string, progressive?: KindlingSave["tasks"][number]["progressive"]) => void;
  addPreset: (text: string, category?: string, progressive?: KindlingSave["tasks"][number]["progressive"]) => void;
  removeTask: (id: string) => void;
  note: (line: string) => void;
  setSound: (on: boolean) => void;
  markSeen: () => void;
  startWalk: (pathId: string) => string | null;
  finishWalk: () => void;
  playerAct: (verb: CombatVerb) => void;
  leaveCombat: () => void;
  clearRoadEcho: () => void;
  openOldGate: () => string | null;
  confirmKindling: () => void;
  hatch: (species: SpeciesId) => void;
  hatchEgg: () => void;
  rename: (name: string) => void;
  keepEncounter: () => void;
  switchCompanion: (id: string) => void;
  breed: (aId: string, bId: string) => void;
  combine: (aId: string, bId: string) => void;
  setBreatheOpen: (open: boolean) => void;
  setEditingGoals: (open: boolean) => void;
  snapshot: () => KindlingSave;
};

function persist(s: KindlingSave) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    /* private mode: play on */
  }
}

function pick<T extends object>(s: T): KindlingSave {
  const {
    v,
    updatedAt,
    tasks,
    sheet,
    fuel,
    kept,
    days,
    streak,
    best,
    lastKept,
    found,
    journal,
    sound,
    seen,
    companion,
    lineage,
    unlocked,
    kindlingPending,
    awaitingHatch,
    egg,
    combat,
    walk,
    encounters,
    roster,
    walkedOnce,
    roadEcho,
    regionEchoes,
    regionMemories,
    oldGateOpened,
    rivals,
  } = s as KindlingSave;
  return {
    v,
    updatedAt,
    tasks,
    sheet,
    fuel,
    kept,
    days,
    streak,
    best,
    lastKept,
    found,
    journal,
    sound,
    seen,
    companion,
    lineage,
    unlocked,
    kindlingPending,
    awaitingHatch,
    egg,
    combat,
    walk,
    encounters,
    roster,
    walkedOnce,
    roadEcho,
    regionEchoes,
    regionMemories,
    oldGateOpened,
    rivals,
  };
}

const flameCopy = (fuel: number) => `${Math.round(fuel * FLAMES_PER_FUEL)} Flames`;

// A Journey is decided when it leaves, not when the player comes back. We do
// not need another save field for that: startedAt + pathId are immutable
// departure facts and therefore form a stable seed across reloads/devices.
function journeyRoll(pathId: string, startedAt: number, salt: number) {
  let h = ((startedAt >>> 0) ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0;
  for (let i = 0; i < pathId.length; i++) {
    h ^= pathId.charCodeAt(i);
    h = Math.imul(h, 0x85ebca6b) >>> 0;
    h ^= h >>> 13;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 0x1_0000_0000;
}


function intentLineFor(
  enemy: SpeciesId,
  intent: { telegraph: CombatVerb; pattern: string; chargePhase: string | null },
) {
  if (intent.pattern === "charging") {
    return chargeIntentLine(intent.telegraph, (intent.chargePhase as "windup" | "release" | null) ?? "windup");
  }
  if (intent.pattern === "feint") {
    return `A false wind-up — it looks like ${intent.telegraph}.`;
  }
  return combatMove(enemy, intent.telegraph).telegraph;
}

function beginRivalCombat(
  s: KindlingSave,
  rival: RoadRival,
): NonNullable<KindlingSave["combat"]> {
  const pc = combatStatsForCompanion(s.companion!) ?? SPECIES[s.companion!.species].combat;
  const softened = rivalPressureSoftened(rival, s.companion);
  const phase = 0;
  const enemyMax = rivalPhaseHp(rival, phase, softened);
  const intent = pickRivalIntent(rival, phase);
  const nerveMax = nerveMaxFor(s.companion);
  const phaseLabel = rival.phases[phase]?.label ?? "Opening";
  const lines = [
    `${rival.name} · ${rival.title} holds the road.`,
    `Phase 1 · ${phaseLabel}.`,
    intentLineFor(rival.species, intent),
  ];
  if (softened) {
    lines.push(rival.pressureHint);
  }
  return {
    enemy: rival.species,
    pathId: rival.pathId,
    playerHp: pc.hp,
    playerMax: pc.hp,
    enemyHp: enemyMax,
    enemyMax,
    telegraph: intent.telegraph,
    log: lines,
    result: null,
    nerve: nerveMax,
    nerveMax,
    pattern: intent.pattern,
    chargeVerb: intent.chargeVerb,
    chargePhase: intent.chargePhase,
    round: 1,
    rivalId: rival.id,
    rivalPhase: phase,
    rivalPhases: rival.phases.length,
    rivalName: rival.name,
  };
}

function beginTrashCombat(
  s: KindlingSave,
  pathId: string,
  enemy: SpeciesId,
): NonNullable<KindlingSave["combat"]> {
  const pc = combatStatsForCompanion(s.companion!) ?? SPECIES[s.companion!.species].combat;
  const ec = SPECIES[enemy].combat;
  const intent = pickEnemyIntent(enemy, pathId);
  const nerveMax = nerveMaxFor(s.companion);
  const archetype = enemyArchetype(pathId);
  return {
    enemy,
    pathId,
    playerHp: pc.hp,
    playerMax: pc.hp,
    enemyHp: ec.hp,
    enemyMax: ec.hp,
    telegraph: intent.telegraph,
    log: [
      `${SPECIES[enemy].name} holds the path · ${archetype.label}.`,
      intentLineFor(enemy, intent),
    ],
    result: null,
    nerve: nerveMax,
    nerveMax,
    pattern: intent.pattern,
    chargeVerb: intent.chargeVerb,
    chargePhase: intent.chargePhase,
    round: 1,
    rivalId: null,
    rivalPhase: 0,
    rivalPhases: 1,
    rivalName: null,
  };
}

export const useKindling = create<KindlingStore>((set, get) => ({
  ...freshSave(),
  hydrated: false,
  tab: "today",
  breatheOpen: false,
  editingGoals: false,
  lastToast: null,

  snapshot: () => pick(get()),

  hydrate: (incoming) => {
    let next: KindlingSave;
    if (incoming) {
      next = normalizeSave(incoming);
    } else if (typeof localStorage !== "undefined") {
      let raw: unknown = null;
      try {
        raw = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      } catch {
        raw = null;
      }
      next = normalizeSave(raw);
    } else {
      next = freshSave();
    }
    applyRollover(next);
    persist(next);
    set({ ...next, hydrated: true });
  },

  setTab: (tab) => set({ tab }),
  setBreatheOpen: (breatheOpen) => set({ breatheOpen }),
  setEditingGoals: (editingGoals) => set({ editingGoals }),

  toggleTask: (id) => {
    const s = pick(get());
    applyRollover(s);
    const at = s.sheet.done.indexOf(id);
    if (at >= 0) {
      s.sheet.done.splice(at, 1);
      journalEntry(s).kept = caredToday(s);
      s.updatedAt = Date.now();
      persist(s);
      set({ ...s, lastToast: null });
      return;
    }
    s.sheet.done.push(id);
    const paid = payOnce(s, id, PAY.task);
    persist(s);
    if (get().sound) playTick();
    set({ ...s, lastToast: paid ? "+20 Flames · +20 Bond XP" : null });
  },

  completeProgressive: (taskId) => {
    const s = pick(get());
    applyRollover(s);
    const task = s.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const next = nextProgressiveTier(s, task);
    if (!next) return;
    if (!grantBonus(s, next.key, next.tier.flames, next.tier.bondXp)) return;
    persist(s);
    if (get().sound) playTick();
    set({ ...s, lastToast: `+${next.tier.flames} Flames · +${next.tier.bondXp} Bond XP` });
  },

  setMood: (mood) => {
    const s = pick(get());
    applyRollover(s);
    s.sheet.mood = mood;
    journalEntry(s).mood = mood;
    const paid = payOnce(s, "mood", PAY.mood);
    persist(s);
    set({ ...s, lastToast: paid ? "+20 Flames · +20 Bond XP" : "noted" });
  },

  countBreath: () => {
    const s = pick(get());
    applyRollover(s);
    s.sheet.breaths += 1;
    const paid = payOnce(s, `breath:${Math.min(3, s.sheet.breaths)}`, PAY.breath);
    persist(s);
    set({ ...s, lastToast: paid ? "+40 Flames · +20 Bond XP" : "still, anyway" });
  },

  addTask: (text, category, progressive) => {
    const s = pick(get());
    const clean = text.trim().slice(0, 46);
    if (!clean || s.tasks.length >= 14) return;
    s.tasks.push({ id: "c" + Date.now().toString(36), text: clean, custom: true, category, progressive });
    s.updatedAt = Date.now();
    persist(s);
    set(s);
  },

  addPreset: (text, category, progressive) => {
    const s = pick(get());
    if (s.tasks.length >= 14) return;
    if (s.tasks.some((t) => t.text.toLowerCase() === text.toLowerCase())) return;
    s.tasks.push({ id: "c" + Date.now().toString(36), text, custom: true, category, progressive });
    s.updatedAt = Date.now();
    persist(s);
    set(s);
  },

  removeTask: (id) => {
    const s = pick(get());
    s.tasks = s.tasks.filter((t) => t.id !== id);
    s.sheet.done = s.sheet.done.filter((d) => d !== id);
    s.sheet.bonus = s.sheet.bonus.filter((b) => !b.startsWith(`${id}:`));
    journalEntry(s).kept = caredToday(s);
    s.updatedAt = Date.now();
    persist(s);
    set(s);
  },

  note: (line) => {
    const s = pick(get());
    const clean = line.trim().slice(0, 180);
    if (!clean) return;
    journalEntry(s).lines.push(clean);
    s.updatedAt = Date.now();
    persist(s);
    set(s);
  },

  setSound: (on) => {
    const s = pick(get());
    s.sound = on;
    s.updatedAt = Date.now();
    persist(s);
    if (on) unlockAudio();
    set(s);
  },

  markSeen: () => {
    const s = pick(get());
    s.seen = true;
    s.updatedAt = Date.now();
    persist(s);
    unlockAudio();
    set(s);
  },

  startWalk: (pathId) => {
    const s = pick(get());
    applyRollover(s);
    if (!s.companion) return "No one is here to walk.";
    if (s.combat) return "A fight is still open.";
    if (s.walk) return "Already on a path.";
    if (s.fuel < ERRAND_COST) return `The fire needs ${flameCopy(ERRAND_COST)} first.`;

    if (pathId === "old-gate") {
      if (!oldGateVisible(s)) return "The gate is not yet in sight.";
      s.fuel -= ERRAND_COST;
      const startedAt = Date.now();
      s.walk = { pathId: "old-gate", startedAt, endsAt: startedAt + WALK_DURATION_MS };
      s.walkedOnce = true;
      s.updatedAt = Date.now();
      persist(s);
      set({ ...s, tab: "journey", lastToast: `−${flameCopy(ERRAND_COST)}` });
      return null;
    }

    const path = PATHS.find((p) => p.id === pathId);
    if (!path) return "That path is gone.";
    s.fuel -= ERRAND_COST;
    const startedAt = Date.now();
    s.walk = { pathId, startedAt, endsAt: startedAt + WALK_DURATION_MS };
    s.walkedOnce = true;
    s.updatedAt = Date.now();
    persist(s);
    set({ ...s, tab: "journey", lastToast: `−${flameCopy(ERRAND_COST)}` });
    return null;
  },

  finishWalk: () => {
    const s = pick(get());
    if (!s.walk) return;
    const departure = s.walk;
    s.walk = null;

    if (departure.pathId === "old-gate") {
      const rival = rivalForPath("old-gate");
      if (!rival || !s.companion) {
        s.updatedAt = Date.now();
        persist(s);
        set({ ...s, lastToast: "The gate stands quiet.", tab: "journey" });
        return;
      }
      const status = s.rivals?.[rival.pathId]?.status;
      if (status === "bested") {
        journalEntry(s).lines.push("The Old Gate road is quiet. The keeper already yielded.");
        recordRegionMemory(s, "old-gate", { kind: "rest", text: rival.bestedLine });
        s.updatedAt = Date.now();
        persist(s);
        set({ ...s, lastToast: "The threshold remembers.", tab: "journey" });
        return;
      }
      s.rivals = setRivalStatus(ensureRivalLooming(s.rivals ?? {}, "old-gate"), "old-gate", "challenged");
      s.combat = beginRivalCombat(s, rival);
      s.roadEcho = rival.loomingLine;
      s.updatedAt = Date.now();
      persist(s);
      set({ ...s, lastToast: "A keeper waits at the gate.", tab: "journey" });
      return;
    }

    const path = PATHS.find((p) => p.id === departure.pathId);
    if (!path) {
      persist(s);
      set(s);
      return;
    }

    const rival = rivalForPath(path.id);
    const cleared = pathCleared(s, path.id);
    if (rival && s.companion) {
      const status = s.rivals?.[path.id]?.status;
      const meet = shouldMeetRival(status, cleared, () => journeyRoll(path.id, departure.startedAt, 7));
      if (meet) {
        s.rivals = setRivalStatus(s.rivals ?? {}, path.id, "challenged");
        s.combat = beginRivalCombat(s, rival);
        s.roadEcho = rival.loomingLine;
        s.updatedAt = Date.now();
        persist(s);
        set({ ...s, lastToast: "A keeper holds the road.", tab: "journey" });
        return;
      }
      // First quiet walks can still mark the keeper as looming without a duel yet.
      s.rivals = ensureRivalLooming(s.rivals ?? {}, path.id);
    }

    const fight = Boolean(path.enemy) && journeyRoll(path.id, departure.startedAt, 0) < path.encounter;
    if (fight && path.enemy && s.companion) {
      s.combat = beginTrashCombat(s, path.id, path.enemy);
      s.updatedAt = Date.now();
      persist(s);
      set({ ...s, lastToast: "Something waits.", tab: "journey" });
      return;
    }

    const findIndex = Math.min(
      path.finds.length - 1,
      Math.floor(journeyRoll(path.id, departure.startedAt, 1) * path.finds.length),
    );
    const find = path.finds[findIndex];
    s.found.unshift({
      id: "f" + departure.startedAt.toString(36),
      name: find.name,
      kind: find.kind,
      from: path.id,
      date: dayKey(),
    });
    journalEntry(s).lines.push(`Brought home ${find.name}.`);
    if (rival) s.rivals = ensureRivalLooming(s.rivals ?? {}, path.id);
    s.updatedAt = Date.now();
    persist(s);
    set({ ...s, lastToast: `${s.companion?.name ?? "They"} came home with ${find.name}.`, tab: "pack" });
  },

  playerAct: (verb) => {
    const s = pick(get());
    const c = s.combat;
    if (!c || c.result || !s.companion) return;
    const pc = combatStatsForCompanion(s.companion) ?? SPECIES[s.companion.species].combat;
    const ec = SPECIES[c.enemy].combat;
    const nerveMax = c.nerveMax || nerveMaxFor(s.companion);
    const nerve = Number.isFinite(c.nerve) ? c.nerve : nerveMax;
    const pattern = c.pattern || "steady";
    const chargePhase = pattern === "charging" ? c.chargePhase ?? "windup" : null;
    const depth = resolveDepthRound({
      player: verb,
      telegraph: c.telegraph,
      pattern,
      chargeVerb: c.chargeVerb ?? null,
      chargePhase,
      nerve,
      nerveMax,
      pc,
      ec,
      companion: s.companion,
    });
    const enemyVerb = depth.enemyVerb;
    const { pDmg, eDmg, countered } = depth;
    c.enemyHp = Math.max(0, c.enemyHp - eDmg);
    c.playerHp = Math.max(0, c.playerHp - pDmg);
    c.nerve = depth.nextNerve;
    c.nerveMax = nerveMax;
    c.round = (c.round || 1) + 1;
    const yours = combatMove(s.companion.species, verb);
    const theirs = combatMove(c.enemy, enemyVerb);
    const foeName = c.rivalName || SPECIES[c.enemy].name;
    c.log = [
      exchangeHeadline({
        playerName: s.companion.name,
        playerSpecies: s.companion.species,
        enemy: c.enemy,
        player: verb,
        enemyVerb,
        pDmg,
        eDmg,
        countered,
      }),
      countered ? `Counter lands · ${yours.name} vs ${theirs.name}.` : `${yours.name} · ${yours.beat}`,
      ...depth.beatLines,
      eDmg ? `${foeName} takes ${eDmg}.` : `${foeName} holds.`,
      pDmg ? `${s.companion.name} takes ${pDmg}.` : `${s.companion.name} holds.`,
      `Nerve ${c.nerve}/${c.nerveMax}.`,
    ];

    const rival = rivalById(c.rivalId);
    if (c.enemyHp <= 0 && rival && (c.rivalPhase ?? 0) < (c.rivalPhases ?? 1) - 1) {
      const nextPhase = (c.rivalPhase ?? 0) + 1;
      const softened = rivalPressureSoftened(rival, s.companion);
      const nextMax = rivalPhaseHp(rival, nextPhase, softened);
      c.rivalPhase = nextPhase;
      c.enemyMax = nextMax;
      c.enemyHp = nextMax;
      const phaseLabel = rival.phases[nextPhase]?.label ?? `Phase ${nextPhase + 1}`;
      c.log.push(`Phase ${nextPhase + 1} · ${phaseLabel}. The keeper shifts.`);
      if (softened && nextPhase > 0) c.log.push(rival.pressureHint);
      const intent = pickRivalIntent(rival, nextPhase);
      c.telegraph = intent.telegraph;
      c.pattern = intent.pattern;
      c.chargeVerb = intent.chargeVerb;
      c.chargePhase = intent.chargePhase;
      c.log.push(intentLineFor(c.enemy, intent));
      s.updatedAt = Date.now();
      persist(s);
      set(s);
      return;
    }

    if (c.enemyHp <= 0) {
      c.result = "win";
      s.encounters.wins += 1;
      if (get().sound) playHit();
      if (rival) {
        const aftermath = rivalAftermathCopy({
          result: "win",
          rival,
          companionName: s.companion.name,
        });
        journalEntry(s).lines.push(aftermath.journal);
        s.roadEcho = aftermath.roadEcho;
        recordRegionEcho(s, c.pathId, { text: aftermath.roadEcho, result: "win" });
        recordRegionMemory(s, c.pathId, { kind: "win", text: aftermath.roadEcho });
        s.rivals = setRivalStatus(s.rivals ?? {}, c.pathId, "bested");
        c.log.push(`${rival.name} yields the road.`);
      } else {
        const aftermath = combatAftermathCopy({
          result: "win",
          pathId: c.pathId,
          enemy: c.enemy,
          companionName: s.companion.name,
        });
        journalEntry(s).lines.push(aftermath.journal);
        s.roadEcho = aftermath.roadEcho;
        recordRegionEcho(s, c.pathId, { text: aftermath.roadEcho, result: "win" });
        recordRegionMemory(s, c.pathId, { kind: "win", text: aftermath.roadEcho });
      }
      if (!rival && SPECIES[c.enemy].capturable && !s.unlocked.includes(c.enemy)) {
        s.unlocked.push(c.enemy);
        c.log.push(`${SPECIES[c.enemy].name} will come if you ask.`);
      }
      const already = s.roster.some((m) => m.species === c.enemy);
      if (!rival && SPECIES[c.enemy].capturable && !already && s.roster.length < 6) {
        c.log.push("They could stay by the fire.");
      }
      const path = PATHS.find((p) => p.id === c.pathId);
      const find = path?.finds[0];
      if (find) {
        s.found.unshift({
          id: "f" + Date.now().toString(36),
          name: find.name,
          kind: find.kind,
          from: c.pathId,
          date: dayKey(),
        });
        c.log.push(`Took ${find.name}.`);
      }
    } else if (c.playerHp <= 0) {
      c.result = "lose";
      s.encounters.losses += 1;
      if (rival) {
        const aftermath = rivalAftermathCopy({
          result: "lose",
          rival,
          companionName: s.companion.name,
        });
        journalEntry(s).lines.push(aftermath.journal);
        s.roadEcho = aftermath.roadEcho;
        recordRegionEcho(s, c.pathId, { text: aftermath.roadEcho, result: "lose" });
        recordRegionMemory(s, c.pathId, { kind: "lose", text: aftermath.roadEcho });
        s.rivals = setRivalStatus(s.rivals ?? {}, c.pathId, "challenged");
      } else {
        const aftermath = combatAftermathCopy({
          result: "lose",
          pathId: c.pathId,
          enemy: c.enemy,
          companionName: s.companion.name,
        });
        journalEntry(s).lines.push(aftermath.journal);
        s.roadEcho = aftermath.roadEcho;
        recordRegionEcho(s, c.pathId, { text: aftermath.roadEcho, result: "lose" });
        recordRegionMemory(s, c.pathId, { kind: "lose", text: aftermath.roadEcho });
      }
      c.log.push("The path keeps what it wants. You walk home.");
    } else if (depth.chargeContinues) {
      c.pattern = "charging";
      c.chargePhase = "release";
      c.chargeVerb = c.chargeVerb ?? c.telegraph;
      c.telegraph = c.chargeVerb;
      c.log.push(chargeIntentLine(c.telegraph, "release"));
    } else {
      const intent = rival
        ? pickRivalIntent(rival, c.rivalPhase ?? 0)
        : pickEnemyIntent(c.enemy, c.pathId);
      c.telegraph = intent.telegraph;
      c.pattern = intent.pattern;
      c.chargeVerb = intent.chargeVerb;
      c.chargePhase = intent.chargePhase;
      c.log.push(intentLineFor(c.enemy, intent));
    }
    s.updatedAt = Date.now();
    persist(s);
    set(s);
  },

  leaveCombat: () => {
    const s = pick(get());
    s.combat = null;
    s.updatedAt = Date.now();
    persist(s);
    set({ ...s, tab: "journey" });
  },

  clearRoadEcho: () => {
    const s = pick(get());
    if (!s.roadEcho) return;
    s.roadEcho = null;
    s.updatedAt = Date.now();
    persist(s);
    set(s);
  },

  openOldGate: () => {
    const s = pick(get());
    applyRollover(s);
    if (s.oldGateOpened) return "The gate already stands open.";
    if (!oldGateReady(s)) return "The roads behind you are not finished speaking.";
    s.oldGateOpened = true;
    journalEntry(s).lines.push("The Old Gate opened. A next world waits beyond the threshold.");
    s.updatedAt = Date.now();
    persist(s);
    set({ ...s, lastToast: "The path opens.", tab: "journey" });
    return null;
  },

  keepEncounter: () => {
    const s = pick(get());
    const c = s.combat;
    if (!c || c.result !== "win") return;
    if (c.rivalId || !SPECIES[c.enemy].capturable || s.roster.length >= 6) {
      s.combat = null;
      persist(s);
      set({ ...s, tab: "companion" });
      return;
    }
    if (s.roster.some((m) => m.species === c.enemy)) {
      s.combat = null;
      persist(s);
      set({ ...s, tab: "companion" });
      return;
    }
    const kept = freshCompanion(c.enemy);
    s.roster.push(kept);
    if (!s.unlocked.includes(c.enemy)) s.unlocked.push(c.enemy);
    s.combat = null;
    s.updatedAt = Date.now();
    persist(s);
    set({ ...s, tab: "companion", lastToast: `${kept.name} stays.` });
  },

  switchCompanion: (id) => {
    const s = pick(get());
    const next = s.roster.find((m) => m.id === id);
    if (!next) return;
    s.companion = next;
    s.updatedAt = Date.now();
    persist(s);
    set({ ...s, tab: "today", lastToast: `${next.name} by the fire.` });
  },

  breed: (aId, bId) => {
    const s = pick(get());
    if (s.egg || s.roster.length >= 6) return;
    const a = s.roster.find((m) => m.id === aId);
    const b = s.roster.find((m) => m.id === bId);
    if (!a || !b || bondUnits(a) < 18 || bondUnits(b) < 18) return;
    const child = offspringOf(a.species, b.species);
    if (!child) return;
    // Combining never consumes either parent — both stay in roster/lineage.
    const inherited = a.trait ?? b.trait;
    const trait = Math.random() < 0.12
      ? ASH_TRAITS[Math.floor(Math.random() * ASH_TRAITS.length)]
      : inherited;
    s.egg = {
      species: child,
      parentAId: a.id,
      parentBId: b.id,
      parentAName: a.name,
      parentBName: b.name,
      startedKept: s.kept,
      required: EGG_WARMTH_REQUIRED,
      trait,
    };
    journalEntry(s).lines.push(
      `${a.name} and ${b.name} reached fingertip to fingertip. Fusion energy settled as an egg in the coals.`,
    );
    s.updatedAt = Date.now();
    persist(s);
    set({ ...s, lastToast: "An Ember Egg rests in the coals.", tab: "companion" });
  },

  combine: (aId, bId) => {
    get().breed(aId, bId);
  },

  hatchEgg: () => {
    const s = pick(get());
    if (!s.egg || !eggReady(s) || s.roster.length >= 6) return;
    const egg = s.egg;
    const born = freshCompanion(egg.species, egg.trait);
    s.roster.push(born);
    if (!s.unlocked.includes(egg.species)) s.unlocked.push(egg.species);
    s.egg = null;
    journalEntry(s).lines.push(`${born.name} hatched from the coals.`);
    s.updatedAt = Date.now();
    persist(s);
    set({ ...s, lastToast: `${born.name} hatched.`, tab: "companion" });
  },

  confirmKindling: () => {
    const s = pick(get());
    if (!s.kindlingPending) return;
    if (s.companion) {
      const st = stageOf(s);
      const trait = ASH_TRAITS[Math.floor(Math.random() * ASH_TRAITS.length)];
      s.lineage.unshift({
        id: s.companion.id,
        species: s.companion.species,
        name: s.companion.name,
        stage: st.id,
        kept: bondUnits(s.companion),
        bondXp: s.companion.bondXp,
        kindledOn: dayKey(),
        trait,
      });
      s.roster = s.roster.filter((m) => m.id !== s.companion?.id);
    }
    s.companion = s.roster[0] ?? null;
    s.kindlingPending = false;
    s.awaitingHatch = !s.companion;
    s.combat = null;
    s.walk = null;
    s.updatedAt = Date.now();
    persist(s);
    set({ ...s, tab: "companion" });
  },

  hatch: (species) => {
    const s = pick(get());
    if (!s.awaitingHatch && s.companion) return;
    if (!s.unlocked.includes(species)) return;
    const trait = s.lineage[0]?.trait;
    const born = freshCompanion(species, Math.random() < 0.35 ? trait : undefined);
    s.companion = born;
    s.roster = [born, ...s.roster.filter((m) => m.id !== born.id)];
    s.awaitingHatch = false;
    s.lastKept = prevKey(dayKey());
    s.updatedAt = Date.now();
    persist(s);
    set({ ...s, tab: "today", lastToast: `${s.companion.name} is here.` });
  },

  rename: (name) => {
    const s = pick(get());
    if (!s.companion) return;
    const clean = name.trim().slice(0, 22);
    if (!clean) return;
    s.companion = { ...s.companion, name: clean };
    s.roster = s.roster.map((m) => (m.id === s.companion?.id ? { ...m, name: clean } : m));
    s.updatedAt = Date.now();
    persist(s);
    set(s);
  },
}));

export function selectWarmth(s: KindlingSave) {
  return warmth(s);
}
export function selectCared(s: KindlingSave) {
  return caredToday(s);
}
export function selectStreak(s: KindlingSave) {
  return liveStreak(s);
}
export function selectMissed(s: KindlingSave) {
  return consecutiveMissed(s);
}
export function selectStage(s: KindlingSave) {
  return stageOf(s);
}
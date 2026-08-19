import { create } from "zustand";
import {
  ASH_TRAITS,
  ERRAND_COST,
  PATHS,
  SAVE_KEY,
  SPECIES,
  type CombatVerb,
  type KindlingSave,
  type Mood,
  type SpeciesId,
  type Tab,
  applyRollover,
  caredToday,
  combatFor,
  consecutiveMissed,
  dayKey,
  freshCompanion,
  freshSave,
  journalEntry,
  liveStreak,
  normalizeSave,
  payOnce,
  PAY,
  pickTelegraph,
  prevKey,
  resolveRound,
  stageOf,
  warmth,
  offspringOf,
} from "./model";
import { playHit, playTick, unlockAudio } from "./audio";

type KindlingStore = KindlingSave & {
  hydrated: boolean;
  tab: Tab;
  breatheOpen: boolean;
  editingGoals: boolean;
  lastToast: string | null;
  hydrate: (incoming?: KindlingSave | null) => void;
  setTab: (tab: Tab) => void;
  toggleTask: (id: string) => void;
  setMood: (mood: Mood) => void;
  countBreath: () => void;
  addTask: (text: string, category?: string) => void;
  addPreset: (text: string, category?: string) => void;
  removeTask: (id: string) => void;
  note: (line: string) => void;
  setSound: (on: boolean) => void;
  markSeen: () => void;
  startWalk: (pathId: string) => string | null;
  finishWalk: () => void;
  playerAct: (verb: CombatVerb) => void;
  leaveCombat: () => void;
  confirmKindling: () => void;
  hatch: (species: SpeciesId) => void;
  rename: (name: string) => void;
  keepEncounter: () => void;
  switchCompanion: (id: string) => void;
  breed: (aId: string, bId: string) => void;
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
    combat,
    walk,
    encounters,
    roster,
    walkedOnce,
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
    combat,
    walk,
    encounters,
    roster,
    walkedOnce,
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
    set({ ...s, lastToast: paid ? "+1 kindling" : null });
  },

  setMood: (mood) => {
    const s = pick(get());
    applyRollover(s);
    s.sheet.mood = mood;
    journalEntry(s).mood = mood;
    const paid = payOnce(s, "mood", PAY.mood);
    persist(s);
    set({ ...s, lastToast: paid ? "+1 kindling" : "noted" });
  },

  countBreath: () => {
    const s = pick(get());
    applyRollover(s);
    s.sheet.breaths += 1;
    const paid = payOnce(s, `breath:${Math.min(3, s.sheet.breaths)}`, PAY.breath);
    persist(s);
    set({ ...s, lastToast: paid ? "+2 kindling" : "still, anyway" });
  },

  addTask: (text, category) => {
    const s = pick(get());
    const clean = text.trim().slice(0, 46);
    if (!clean || s.tasks.length >= 14) return;
    s.tasks.push({ id: "c" + Date.now().toString(36), text: clean, custom: true, category });
    s.updatedAt = Date.now();
    persist(s);
    set(s);
  },

  addPreset: (text, category) => {
    const s = pick(get());
    if (s.tasks.length >= 14) return;
    if (s.tasks.some((t) => t.text.toLowerCase() === text.toLowerCase())) return;
    s.tasks.push({ id: "c" + Date.now().toString(36), text, custom: true, category });
    s.updatedAt = Date.now();
    persist(s);
    set(s);
  },

  removeTask: (id) => {
    const s = pick(get());
    s.tasks = s.tasks.filter((t) => t.id !== id);
    s.sheet.done = s.sheet.done.filter((d) => d !== id);
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
    if (s.fuel < ERRAND_COST) return "The fire needs more kindling first.";
    const path = PATHS.find((p) => p.id === pathId);
    if (!path) return "That path is gone.";
    s.fuel -= ERRAND_COST;
    s.walk = { pathId, startedAt: Date.now(), endsAt: Date.now() + 2200 };
    s.walkedOnce = true;
    s.updatedAt = Date.now();
    persist(s);
    set({ ...s, tab: "journey", lastToast: `−${ERRAND_COST} kindling` });
    return null;
  },

  finishWalk: () => {
    const s = pick(get());
    if (!s.walk) return;
    const path = PATHS.find((p) => p.id === s.walk?.pathId);
    s.walk = null;
    if (!path) {
      persist(s);
      set(s);
      return;
    }
    const fight = path.enemy && Math.random() < path.encounter;
    if (fight && path.enemy && s.companion) {
      const pc = combatFor(s.companion.species);
      const ec = combatFor(path.enemy);
      s.combat = {
        enemy: path.enemy,
        pathId: path.id,
        playerHp: pc.hp,
        playerMax: pc.hp,
        enemyHp: ec.hp,
        enemyMax: ec.hp,
        telegraph: pickTelegraph(path.enemy),
        log: [`${SPECIES[path.enemy].name} holds the path.`],
        result: null,
      };
      persist(s);
      set({ ...s, lastToast: "something waits" });
      return;
    }
    const find = path.finds[Math.floor(Math.random() * path.finds.length)];
    s.found.unshift({
      id: "f" + Date.now().toString(36),
      name: find.name,
      kind: find.kind,
      from: path.id,
      date: dayKey(),
    });
    journalEntry(s).lines.push(`Brought home ${find.name}.`);
    s.updatedAt = Date.now();
    persist(s);
    set({ ...s, lastToast: find.name, tab: "pack" });
  },

  playerAct: (verb) => {
    const s = pick(get());
    const c = s.combat;
    if (!c || c.result || !s.companion) return;
    const pc = combatFor(s.companion.species);
    const ec = combatFor(c.enemy);
    const { pDmg, eDmg } = resolveRound(verb, c.telegraph, pc, ec);
    c.enemyHp = Math.max(0, c.enemyHp - eDmg);
    c.playerHp = Math.max(0, c.playerHp - pDmg);
    c.log = [
      `You ${verb}. They ${c.telegraph}.`,
      eDmg ? `${SPECIES[c.enemy].name} takes ${eDmg}.` : `${SPECIES[c.enemy].name} holds.`,
      pDmg ? `${s.companion.name} takes ${pDmg}.` : `${s.companion.name} holds.`,
    ];
    if (c.enemyHp <= 0) {
      c.result = "win";
      s.encounters.wins += 1;
      if (get().sound) playHit();
      if (SPECIES[c.enemy].capturable && !s.unlocked.includes(c.enemy)) {
        s.unlocked.push(c.enemy);
        c.log.push(`${SPECIES[c.enemy].name} will come if you ask.`);
      }
      const already = s.roster.some((m) => m.species === c.enemy);
      if (SPECIES[c.enemy].capturable && !already && s.roster.length < 6) {
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
      c.log.push("The path keeps what it wants. You walk home.");
    } else {
      c.telegraph = pickTelegraph(c.enemy);
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

  keepEncounter: () => {
    const s = pick(get());
    const c = s.combat;
    if (!c || c.result !== "win") return;
    if (!SPECIES[c.enemy].capturable || s.roster.length >= 6) {
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
    const a = s.roster.find((m) => m.id === aId);
    const b = s.roster.find((m) => m.id === bId);
    if (!a || !b || s.roster.length >= 6) return;
    const child = offspringOf(a.species, b.species);
    if (!child) return;
    const born = freshCompanion(child, a.trait ?? b.trait);
    if (child === "ashling") born.name = "Ashling";
    s.roster.push(born);
    if (!s.unlocked.includes(child)) s.unlocked.push(child);
    journalEntry(s).lines.push(`${a.name} and ${b.name} left an egg in the coals.`);
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
        kept: s.kept,
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

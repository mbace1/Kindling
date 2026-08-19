export const SAVE_KEY = "kindlingState";
export const SAVE_VERSION = 1;
export const FULL_DAY = 5;
export const PAY = { task: 1, mood: 1, breath: 2 } as const;
export const ERRAND_COST = 3;

export const STAGES = [
  { at: 0, id: "spark", name: "a spark" },
  { at: 6, id: "wisp", name: "a wisp" },
  { at: 18, id: "tender", name: "a tender" },
  { at: 40, id: "keeper", name: "a keeper" },
  { at: 80, id: "elder", name: "an elder" },
] as const;

export type StageId = (typeof STAGES)[number]["id"];
export type SpeciesId = "ember" | "mossling" | "ashling" | "mossknight";
export type Tab = "today" | "journey" | "companion" | "pack" | "journal";
export type Mood = "dim" | "quiet" | "steady" | "bright" | "fierce";
export type CombatVerb = "strike" | "guard" | "skill";
export type FindKind = "relic" | "memory" | "shard" | "moss" | "ash";

export type Task = { id: string; text: string; custom?: boolean; category?: string };

export type Sheet = {
  date: string;
  done: string[];
  paid: string[];
  mood: Mood | null;
  breaths: number;
};

export type JournalEntry = {
  date: string;
  kept: number;
  mood: Mood | null;
  lines: string[];
};

export type FoundItem = {
  id: string;
  name: string;
  kind: FindKind;
  from: string;
  date: string;
};

export type Companion = {
  id: string;
  species: SpeciesId;
  name: string;
  born: string;
  trait?: string;
};

export type Ancestor = {
  id: string;
  species: SpeciesId;
  name: string;
  stage: StageId;
  kept: number;
  kindledOn: string;
  trait?: string;
};

export type CombatState = {
  enemy: SpeciesId;
  pathId: string;
  playerHp: number;
  playerMax: number;
  enemyHp: number;
  enemyMax: number;
  telegraph: CombatVerb;
  log: string[];
  result: null | "win" | "lose";
};

export type WalkState = {
  pathId: string;
  startedAt: number;
  endsAt: number;
};

export type KindlingSave = {
  v: number;
  updatedAt: number;
  tasks: Task[];
  sheet: Sheet;
  fuel: number;
  kept: number;
  days: number;
  streak: number;
  best: number;
  lastKept: string | null;
  found: FoundItem[];
  journal: JournalEntry[];
  sound: boolean;
  seen: boolean;
  companion: Companion | null;
  lineage: Ancestor[];
  unlocked: SpeciesId[];
  kindlingPending: boolean;
  awaitingHatch: boolean;
  combat: CombatState | null;
  walk: WalkState | null;
  encounters: { wins: number; losses: number };
  roster: Companion[];
  walkedOnce: boolean;
};

export type Species = {
  id: SpeciesId;
  name: string;
  roles: string[];
  unit: number;
  crown: string;
  build: string;
  blurb: string;
  combat: {
    hp: number;
    strike: number;
    guard: number;
    skill: number;
    speed: number;
    tendency: string;
  };
  capturable: boolean;
};

export const SPECIES: Record<SpeciesId, Species> = {
  ember: {
    id: "ember",
    name: "Ember",
    roles: ["companion", "breeder"],
    unit: 1.6,
    crown: "horn",
    build: "round",
    blurb: "Stone that learned to keep a fire.",
    combat: { hp: 26, strike: 6, guard: 4, skill: 7, speed: 6, tendency: "skill-focused" },
    capturable: false,
  },
  mossling: {
    id: "mossling",
    name: "Mossling",
    roles: ["companion", "breeder", "wild"],
    unit: 1.6,
    crown: "antler",
    build: "round",
    blurb: "Moss and bark, with a satchel of small things.",
    combat: { hp: 30, strike: 4, guard: 6, skill: 8, speed: 4, tendency: "guard-heavy" },
    capturable: true,
  },
  ashling: {
    id: "ashling",
    name: "Ashling",
    roles: ["companion", "breeder", "wild", "offspring"],
    unit: 1.2,
    crown: "spike",
    build: "drake",
    blurb: "A hatchling ember-drake. Fast, a little reckless.",
    combat: { hp: 20, strike: 8, guard: 2, skill: 6, speed: 9, tendency: "quick-striker" },
    capturable: true,
  },
  mossknight: {
    id: "mossknight",
    name: "Moss Knight",
    roles: ["enemy", "wild"],
    unit: 2.4,
    crown: "helm",
    build: "armoured",
    blurb: "Slow. Relentless. An enemy you can keep.",
    combat: { hp: 48, strike: 9, guard: 10, skill: 3, speed: 2, tendency: "counterattacker" },
    capturable: true,
  },
};

export const DEFAULT_TASKS: Task[] = [
  { id: "water", text: "Drank some water", category: "body" },
  { id: "outside", text: "Stepped outside", category: "daily" },
  { id: "moved", text: "Moved your body", category: "body" },
  { id: "ate", text: "Ate something real", category: "body" },
  { id: "tidied", text: "Put one thing back", category: "daily" },
  { id: "said", text: "Said something to someone", category: "connection" },
];

export const PRESET_TASKS: Task[] = [
  { id: "p-water", text: "Drank some water", category: "body" },
  { id: "p-moved", text: "Moved your body", category: "body" },
  { id: "p-ate", text: "Ate something real", category: "body" },
  { id: "p-stretch", text: "Stretched", category: "body" },
  { id: "p-teeth", text: "Brushed your teeth", category: "hygiene" },
  { id: "p-face", text: "Washed your face", category: "hygiene" },
  { id: "p-clothes", text: "Changed your clothes", category: "hygiene" },
  { id: "p-still", text: "Sat still a minute", category: "mind" },
  { id: "p-wrote", text: "Wrote one line", category: "mind" },
  { id: "p-phone", text: "Put the phone down", category: "mind" },
  { id: "p-said", text: "Said something to someone", category: "connection" },
  { id: "p-note", text: "Sent a note", category: "connection" },
  { id: "p-outside", text: "Stepped outside", category: "daily" },
  { id: "p-tidied", text: "Put one thing back", category: "daily" },
];

export const MOODS: { id: Mood; label: string }[] = [
  { id: "dim", label: "Dim" },
  { id: "quiet", label: "Quiet" },
  { id: "steady", label: "Steady" },
  { id: "bright", label: "Bright" },
  { id: "fierce", label: "Fierce" },
];

export const PATHS = [
  {
    id: "ruin",
    name: "Birch ruin",
    blurb: "Cold stone. Quiet finds.",
    encounter: 0.22,
    enemy: null as SpeciesId | null,
    finds: [
      { name: "a cold coin", kind: "relic" as FindKind },
      { name: "arch moss", kind: "moss" as FindKind },
      { name: "a moon chip", kind: "shard" as FindKind },
    ],
  },
  {
    id: "forest",
    name: "Deep forest",
    blurb: "Moss, root, and something watching.",
    encounter: 0.48,
    enemy: "mossling" as SpeciesId,
    finds: [
      { name: "a root bead", kind: "relic" as FindKind },
      { name: "a soft cap", kind: "moss" as FindKind },
      { name: "sap on a thumb", kind: "memory" as FindKind },
    ],
  },
  {
    id: "ash",
    name: "Ash waste",
    blurb: "The fire was here once.",
    encounter: 0.48,
    enemy: "ashling" as SpeciesId,
    finds: [
      { name: "a cinder tooth", kind: "ash" as FindKind },
      { name: "glass sand", kind: "shard" as FindKind },
      { name: "a warm pebble", kind: "memory" as FindKind },
    ],
  },
  {
    id: "road",
    name: "Knight road",
    blurb: "Something waits under the banners.",
    encounter: 0.72,
    enemy: "mossknight" as SpeciesId,
    finds: [
      { name: "a rust rivet", kind: "relic" as FindKind },
      { name: "banner thread", kind: "memory" as FindKind },
    ],
  },
] as const;

export const ASH_TRAITS = ["ember-core", "quiet-guard", "quick-spark", "moss-memory"] as const;

export function dayKey(d = new Date()) {
  const t = new Date(d.getTime() - 4 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
}

export function prevKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(y, m - 1, d, 12);
  t.setDate(t.getDate() - 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
}

export function formatDay(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function newId(prefix = "k") {
  return prefix + Math.random().toString(36).slice(2, 9);
}

export function freshCompanion(species: SpeciesId, trait?: string): Companion {
  const spec = SPECIES[species];
  return { id: newId("c"), species, name: spec.name, born: dayKey(), trait };
}

export function freshSave(): KindlingSave {
  const companion = freshCompanion("ember");
  return {
    v: SAVE_VERSION,
    updatedAt: Date.now(),
    tasks: DEFAULT_TASKS.map((t) => ({ ...t })),
    sheet: { date: dayKey(), done: [], paid: [], mood: null, breaths: 0 },
    fuel: 0,
    kept: 0,
    days: 0,
    streak: 0,
    best: 0,
    lastKept: null,
    found: [],
    journal: [],
    sound: false,
    seen: false,
    companion,
    lineage: [],
    unlocked: ["ember"],
    kindlingPending: false,
    awaitingHatch: false,
    combat: null,
    walk: null,
    encounters: { wins: 0, losses: 0 },
    roster: [companion],
    walkedOnce: false,
  };
}

export function caredToday(s: KindlingSave) {
  return s.sheet.done.length + (s.sheet.mood ? 1 : 0) + Math.min(3, s.sheet.breaths);
}

export function warmth(s: KindlingSave) {
  return Math.min(1, caredToday(s) / FULL_DAY);
}

export function liveStreak(s: KindlingSave) {
  const today = dayKey();
  if (s.lastKept === today || s.lastKept === prevKey(today)) return s.streak;
  return 0;
}

export function stageOf(s: KindlingSave) {
  let out: (typeof STAGES)[number] = STAGES[0];
  for (const st of STAGES) if (s.kept >= st.at) out = st;
  return out;
}

export function nextStage(s: KindlingSave) {
  return STAGES.find((st) => s.kept < st.at) ?? null;
}

export function consecutiveMissed(s: KindlingSave) {
  if (!s.lastKept) return 0;
  const today = dayKey();
  if (s.lastKept === today) return 0;
  let count = 0;
  let k = prevKey(today);
  while (k !== s.lastKept && count < 40) {
    count += 1;
    k = prevKey(k);
  }
  return count;
}

export function warningState(s: KindlingSave) {
  return consecutiveMissed(s) === 1 && caredToday(s) === 0 && !s.kindlingPending;
}

function uniqueJournal(entries: JournalEntry[]) {
  const seen = new Set<string>();
  const out: JournalEntry[] = [];
  for (const e of entries) {
    if (!e?.date || seen.has(e.date)) continue;
    seen.add(e.date);
    out.push(e);
  }
  return out;
}

export function journalEntry(s: KindlingSave) {
  const today = dayKey();
  const existing = s.journal.find((e) => e.date === today);
  if (existing) {
    if (s.journal[0] !== existing) {
      s.journal = [existing, ...s.journal.filter((e) => e.date !== today)];
    }
    return s.journal[0];
  }
  s.journal.unshift({ date: today, kept: 0, mood: null, lines: [] });
  s.journal.length = Math.min(s.journal.length, 120);
  return s.journal[0];
}

export function applyRollover(s: KindlingSave) {
  const today = dayKey();
  if (s.sheet.date !== today) {
    s.sheet = { date: today, done: [], paid: [], mood: null, breaths: 0 };
  }
  if (s.companion && !s.kindlingPending && !s.awaitingHatch && consecutiveMissed(s) >= 2) {
    s.kindlingPending = true;
  }
  if (s.walk && s.walk.endsAt < Date.now() - 60_000) {
    s.walk = null;
  }
  return s;
}

export function normalizeSave(raw: unknown): KindlingSave {
  const base = freshSave();
  if (!raw || typeof raw !== "object") return applyRollover(base);
  const r = raw as Partial<KindlingSave>;
  if (r.v !== SAVE_VERSION) return applyRollover(base);
  const s: KindlingSave = {
    ...base,
    ...r,
    tasks: Array.isArray(r.tasks) && r.tasks.length ? r.tasks : base.tasks,
    sheet: { ...base.sheet, ...(r.sheet ?? {}) },
    found: Array.isArray(r.found) ? r.found : [],
    journal: uniqueJournal(Array.isArray(r.journal) ? r.journal : []),
    lineage: Array.isArray(r.lineage) ? r.lineage : [],
    unlocked: Array.isArray(r.unlocked) && r.unlocked.length ? r.unlocked : ["ember"],
    encounters: { wins: 0, losses: 0, ...(r.encounters ?? {}) },
    roster: Array.isArray(r.roster) ? r.roster : [],
    walkedOnce: Boolean(r.walkedOnce),
  };
  if (!Array.isArray(s.sheet.paid)) s.sheet.paid = [...s.sheet.done];
  if (!s.companion && !s.awaitingHatch && !s.kindlingPending) {
    s.companion = freshCompanion("ember");
  }
  if (s.companion && !s.roster.some((c) => c.id === s.companion?.id)) {
    s.roster = [s.companion, ...s.roster];
  }
  return applyRollover(s);
}

export function payOnce(s: KindlingSave, key: string, pay: number) {
  if (s.sheet.paid.includes(key)) return false;
  s.sheet.paid.push(key);
  const today = dayKey();
  if (s.lastKept !== today) {
    s.streak = s.lastKept === prevKey(today) ? s.streak + 1 : 1;
    s.best = Math.max(s.best, s.streak);
    s.lastKept = today;
    s.days += 1;
  }
  s.fuel += pay;
  s.kept += 1;
  journalEntry(s).kept = caredToday(s);
  s.updatedAt = Date.now();
  return true;
}

export function combatFor(species: SpeciesId) {
  const c = SPECIES[species].combat;
  return { ...c };
}

export function pickTelegraph(enemy: SpeciesId): CombatVerb {
  const t = SPECIES[enemy].combat.tendency;
  const roll = Math.random();
  if (t === "guard-heavy") return roll < 0.55 ? "guard" : roll < 0.8 ? "strike" : "skill";
  if (t === "quick-striker") return roll < 0.6 ? "strike" : roll < 0.8 ? "skill" : "guard";
  if (t === "counterattacker") return roll < 0.5 ? "guard" : roll < 0.8 ? "strike" : "skill";
  return roll < 0.4 ? "skill" : roll < 0.75 ? "strike" : "guard";
}

export function resolveRound(player: CombatVerb, enemy: CombatVerb, pc: Species["combat"], ec: Species["combat"]) {
  let pDmg = 0;
  let eDmg = 0;
  const pAtk = player === "skill" ? pc.skill : pc.strike;
  const eAtk = enemy === "skill" ? ec.skill : ec.strike;
  if (player === "strike" || player === "skill") {
    eDmg = Math.max(1, pAtk - (enemy === "guard" ? Math.ceil(ec.guard / 2) : 0));
    if (player === "skill") eDmg += 1;
  }
  if (enemy === "strike" || enemy === "skill") {
    pDmg = Math.max(1, eAtk - (player === "guard" ? Math.ceil(pc.guard / 2) : 0));
    if (enemy === "skill") pDmg += 1;
    if (player === "guard" && ec.tendency === "counterattacker") pDmg += 2;
  }
  if (player === "guard" && enemy === "strike") pDmg = Math.max(0, pDmg - 2);
  return { pDmg, eDmg };
}

export function spriteSrc(id: SpeciesId) {
  return `/art/${id}.png`;
}

export function portraitSrc(id: SpeciesId) {
  return `/art/${id}-portrait.png`;
}

export function verbLabel(v: CombatVerb) {
  return v === "strike" ? "Strike" : v === "guard" ? "Guard" : "Skill";
}

export function canBreed(a: SpeciesId, b: SpeciesId) {
  const pairs: Record<SpeciesId, SpeciesId[]> = {
    ember: ["ember", "mossling", "ashling"],
    mossling: ["ember", "mossling"],
    ashling: ["ember", "ashling"],
    mossknight: [],
  };
  return pairs[a].includes(b) && pairs[b].includes(a);
}

export function offspringOf(a: SpeciesId, b: SpeciesId): SpeciesId | null {
  if (!canBreed(a, b)) return null;
  return a === b ? a : "ashling";
}

export function pairings(roster: Companion[]) {
  const out: { a: Companion; b: Companion; child: SpeciesId }[] = [];
  for (let i = 0; i < roster.length; i++) {
    for (let j = i + 1; j < roster.length; j++) {
      const child = offspringOf(roster[i].species, roster[j].species);
      if (child) out.push({ a: roster[i], b: roster[j], child });
    }
  }
  return out;
}

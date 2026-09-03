import type { KindlingSave } from "./model";

export const CURRENT_SAVE_VERSION = 1;
export const SAVE_BACKUP_KEY = "kindlingState:backup";

type RawSave = Record<string, unknown>;

type Migration = (raw: RawSave) => RawSave;

const MIGRATIONS: Record<number, Migration> = {
  0: (raw) => ({ ...raw, v: 1 }),
};

export function migrateSavePayload(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false as const, reason: "not-an-object" };
  let raw = { ...(input as RawSave) };
  let version = Number.isFinite(Number(raw.v)) ? Number(raw.v) : 0;
  if (version > CURRENT_SAVE_VERSION) return { ok: false as const, reason: "future-version", version };
  const applied: number[] = [];
  while (version < CURRENT_SAVE_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) return { ok: false as const, reason: "missing-migration", version };
    raw = migrate(raw);
    applied.push(version);
    version = Number(raw.v);
  }
  return { ok: true as const, value: raw, applied, version };
}

export function backupLocalSave(raw: unknown) {
  if (typeof localStorage === "undefined" || raw == null) return false;
  try {
    localStorage.setItem(SAVE_BACKUP_KEY, JSON.stringify({ at: Date.now(), raw }));
    return true;
  } catch {
    return false;
  }
}

export function exportSaveText(save: KindlingSave) {
  return JSON.stringify({ kindling: true, exportedAt: new Date().toISOString(), save }, null, 2);
}

export function importSaveText(text: string) {
  try {
    const parsed = JSON.parse(text) as unknown;
    const candidate = parsed && typeof parsed === "object" && "save" in parsed ? (parsed as { save: unknown }).save : parsed;
    return migrateSavePayload(candidate);
  } catch {
    return { ok: false as const, reason: "invalid-json" };
  }
}

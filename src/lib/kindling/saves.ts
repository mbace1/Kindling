import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { normalizeSave, type KindlingSave } from "./model";
import { migrateSavePayload } from "./save-recovery";

export const loadCloudSave = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql.query<{ save: KindlingSave | string; updated_at: string }>(
      "select save, updated_at from kindling_saves where user_id = $1",
      [context.userId],
    );
    const row = rows[0];
    if (!row) return null;
    const raw = typeof row.save === "string" ? JSON.parse(row.save) : row.save;
    const migrated = migrateSavePayload(raw);
    return migrated.ok ? normalizeSave(migrated.value) : null;
  });

export const writeCloudSave = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((save: KindlingSave) => normalizeSave(save))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql.query(
      `insert into kindling_saves (user_id, save, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (user_id) do update set save = excluded.save, updated_at = now()`,
      [context.userId, JSON.stringify(data)],
    );
    return { ok: true as const };
  });

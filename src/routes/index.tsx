import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { GameFeelLayer } from "@/components/game-feel-layer";
import { SAVE_KEY } from "@/lib/kindling/model";
import { backupLocalSave, migrateSavePayload } from "@/lib/kindling/save-recovery";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [saveReady, setSaveReady] = useState(false);

  useEffect(() => {
    try {
      const text = localStorage.getItem(SAVE_KEY);
      if (text) {
        const raw = JSON.parse(text);
        const migrated = migrateSavePayload(raw);
        if (migrated.ok) {
          if (migrated.applied.length) backupLocalSave(raw);
          localStorage.setItem(SAVE_KEY, JSON.stringify(migrated.value));
        } else {
          backupLocalSave(raw);
          localStorage.removeItem(SAVE_KEY);
        }
      }
    } catch {
      const broken = localStorage.getItem(SAVE_KEY);
      if (broken) localStorage.setItem("kindlingState:backup-text", broken);
      localStorage.removeItem(SAVE_KEY);
    } finally {
      setSaveReady(true);
    }
  }, []);

  if (!saveReady) return <div className="min-h-dvh bg-night" aria-label="Recovering save" />;
  return (
    <>
      <AppShell />
      <GameFeelLayer />
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import { stageOfCompanion } from "@/lib/kindling/model";
import { emitGameFeel, subscribeGameFeel, type GameFeelEvent } from "@/lib/kindling/game-feel";
import { useKindling } from "@/lib/kindling/store";

export function GameFeelLayer() {
  const s = useKindling();
  const previousPlayerHp = useRef<number | null>(null);
  const previousEnemyHp = useRef<number | null>(null);
  const previousResult = useRef<string | null>(null);
  const previousFind = useRef<string | null>(null);
  const previousStage = useRef<string | null>(null);
  const [event, setEvent] = useState<GameFeelEvent | null>(null);

  useEffect(() => subscribeGameFeel((next) => {
    setEvent(next);
    const timer = window.setTimeout(() => setEvent(null), next.type === "victory" || next.type === "bond-level-up" ? 850 : 520);
    return () => window.clearTimeout(timer);
  }), []);

  useEffect(() => {
    const c = s.combat;
    if (!c) {
      previousPlayerHp.current = null;
      previousEnemyHp.current = null;
      previousResult.current = null;
      return;
    }
    if (previousPlayerHp.current !== null && c.playerHp < previousPlayerHp.current) emitGameFeel({ type: "combat-hit", side: "player", amount: previousPlayerHp.current - c.playerHp });
    if (previousEnemyHp.current !== null && c.enemyHp < previousEnemyHp.current) emitGameFeel({ type: "combat-hit", side: "enemy", amount: previousEnemyHp.current - c.enemyHp });
    if (previousResult.current !== "win" && c.result === "win") emitGameFeel({ type: "victory" });
    previousPlayerHp.current = c.playerHp;
    previousEnemyHp.current = c.enemyHp;
    previousResult.current = c.result;
  }, [s.combat?.playerHp, s.combat?.enemyHp, s.combat?.result]);

  useEffect(() => {
    const id = s.found[0]?.id ?? null;
    if (previousFind.current && id && id !== previousFind.current) emitGameFeel({ type: "discovery", label: s.found[0]?.name });
    previousFind.current = id;
  }, [s.found[0]?.id]);

  useEffect(() => {
    const stage = s.companion ? stageOfCompanion(s.companion) : null;
    if (previousStage.current && stage && previousStage.current !== stage.id) emitGameFeel({ type: "bond-level-up", label: stage.name });
    previousStage.current = stage?.id ?? null;
  }, [s.companion?.id, s.companion?.bondXp]);

  if (!event) return null;
  const text = event.type === "combat-hit" ? `−${event.amount}` : event.type === "victory" ? "Victory" : event.type === "discovery" ? (event.label ?? "Found") : event.type === "bond-level-up" ? `Bond · ${event.label ?? "grew"}` : "Guard";
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-0 z-[80] grid place-items-center overflow-hidden">
      <div className={`rounded-full border px-4 py-2 font-display text-lg shadow-2xl backdrop-blur-sm ${event.type === "combat-hit" ? "border-bone/25 bg-night/80 text-bone" : "border-fire/40 bg-night/88 text-fire"}`}>
        {text}
      </div>
      {event.type === "victory" || event.type === "bond-level-up" ? <div className="absolute inset-0 animate-[pulse_650ms_ease-out_1] bg-[radial-gradient(circle_at_center,rgba(255,181,78,0.14),transparent_48%)]" /> : null}
    </div>
  );
}

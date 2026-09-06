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
    const long = next.type === "victory" || next.type === "bond-level-up" || next.type === "discovery";
    const timer = window.setTimeout(() => setEvent(null), long ? 980 : 580);
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

  const isHit = event.type === "combat-hit";
  const isPlayerHit = isHit && event.side === "player";
  const isEnemyHit = isHit && event.side === "enemy";
  const text = isHit
    ? `−${event.amount}`
    : event.type === "victory"
      ? "Path held"
      : event.type === "discovery"
        ? (event.label ?? "Found")
        : event.type === "bond-level-up"
          ? `Bond · ${event.label ?? "grew"}`
          : "Guard";

  return (
    <div
      aria-live="polite"
      data-game-feel={event.type}
      className={`pointer-events-none fixed inset-0 z-[80] overflow-hidden ${isHit ? "animate-[kindling-hit-shake_180ms_ease-out_1]" : ""}`}
    >
      {isPlayerHit ? <div className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(to_right,rgba(191,60,42,0.26),transparent)]" /> : null}
      {isEnemyHit ? <div className="absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(to_left,rgba(255,181,78,0.22),transparent)]" /> : null}
      {event.type === "victory" ? (
        <div className="absolute inset-0 animate-[kindling-reward-bloom_920ms_ease-out_1] bg-[radial-gradient(circle_at_center,rgba(255,181,78,0.24),rgba(255,122,42,0.06)_32%,transparent_62%)]" />
      ) : null}
      {event.type === "bond-level-up" ? (
        <div className="absolute inset-0 animate-[kindling-reward-bloom_920ms_ease-out_1] bg-[radial-gradient(circle_at_50%_42%,rgba(255,205,122,0.22),transparent_52%)]" />
      ) : null}
      <div className={`absolute left-1/2 -translate-x-1/2 ${isHit ? (isPlayerHit ? "bottom-[31%] -translate-x-[120%]" : "bottom-[31%] translate-x-[20%]") : "top-[42%]"}`}>
        <div
          className={`rounded-full border px-4 py-2 font-display shadow-2xl backdrop-blur-sm ${
            isHit
              ? "animate-[kindling-damage-pop_560ms_ease-out_1] border-bone/20 bg-night/88 text-2xl font-semibold text-bone"
              : "animate-[kindling-reward-rise_920ms_ease-out_1] border-fire/45 bg-night/92 text-xl text-fire"
          }`}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

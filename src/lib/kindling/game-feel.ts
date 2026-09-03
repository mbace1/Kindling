export type GameFeelEvent =
  | { type: "combat-hit"; amount: number; side: "player" | "enemy" }
  | { type: "guard-impact"; amount?: number }
  | { type: "victory" }
  | { type: "discovery"; label?: string }
  | { type: "bond-level-up"; label?: string };

const EVENT_NAME = "kindling:game-feel";

export function emitGameFeel(detail: GameFeelEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<GameFeelEvent>(EVENT_NAME, { detail }));
}

export function subscribeGameFeel(listener: (event: GameFeelEvent) => void) {
  if (typeof window === "undefined") return () => undefined;
  const handle = (event: Event) => listener((event as CustomEvent<GameFeelEvent>).detail);
  window.addEventListener(EVENT_NAME, handle);
  return () => window.removeEventListener(EVENT_NAME, handle);
}

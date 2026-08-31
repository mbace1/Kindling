import { Flame, Search, TimerReset } from "lucide-react";
import { PATHS, SAVE_KEY, dayKey } from "@/lib/kindling/model";
import { useKindling } from "@/lib/kindling/store";

const CHOICE_AT = 0.34;
const markerPrefix = (startedAt: number) => `journey-choice:${startedAt}:`;

function persistCurrent() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(useKindling.getState().snapshot()));
  } catch {
    /* local play continues */
  }
}

export function JourneyDecision({ travel, startedAt, pathId }: { travel: number; startedAt: number; pathId: string }) {
  const s = useKindling();
  const prefix = markerPrefix(startedAt);
  const resolved = s.sheet.bonus.find((entry) => entry.startsWith(prefix));

  if (travel < CHOICE_AT || resolved || !s.walk || s.walk.startedAt !== startedAt) return null;

  const choose = (choice: "investigate" | "rest" | "shortcut") => {
    const current = useKindling.getState();
    const walk = current.walk;
    if (!walk || walk.startedAt !== startedAt) return;
    if (current.sheet.bonus.some((entry) => entry.startsWith(prefix))) return;

    const marker = `${prefix}${choice}`;
    const sheet = { ...current.sheet, bonus: [...current.sheet.bonus, marker] };
    const updatedAt = Date.now();

    if (choice === "investigate") {
      const path = PATHS.find((entry) => entry.id === pathId);
      const find = path?.finds[0];
      if (find) {
        const found = [
          {
            id: `jx${startedAt.toString(36)}`,
            name: find.name,
            kind: find.kind,
            from: pathId,
            date: dayKey(),
          },
          ...current.found,
        ];
        useKindling.setState({
          found,
          sheet,
          walk: { ...walk, endsAt: walk.endsAt + 20_000 },
          updatedAt,
          lastToast: `A closer look found ${find.name}. · +20s`,
        });
      }
    } else if (choice === "rest") {
      const companion = current.companion
        ? { ...current.companion, bondXp: current.companion.bondXp + 20 }
        : null;
      const roster = companion
        ? current.roster.map((member) => (member.id === companion.id ? companion : member))
        : current.roster;
      useKindling.setState({
        companion,
        roster,
        sheet,
        walk: { ...walk, endsAt: walk.endsAt + 10_000 },
        updatedAt,
        lastToast: "A quiet rest. · +20 Bond XP · +10s",
      });
    } else {
      useKindling.setState({
        sheet,
        walk: { ...walk, endsAt: Math.max(Date.now() + 3_000, walk.endsAt - 25_000) },
        updatedAt,
        lastToast: "Shortcut taken. · −25s",
      });
    }

    queueMicrotask(persistCurrent);
  };

  return (
    <div className="absolute inset-x-3 bottom-3 z-10 rounded-lg border border-fire/35 bg-night/95 p-3 shadow-xl backdrop-blur-sm sm:left-auto sm:right-4 sm:w-80">
      <p className="text-xs uppercase tracking-[0.18em] text-fire">A fork in the road</p>
      <p className="mt-1 text-sm font-medium text-bone">Something changes the journey.</p>
      <p className="mt-0.5 text-xs text-bone/65">Choose once. The road remembers.</p>
      <div className="mt-3 grid gap-2">
        <button type="button" onClick={() => choose("investigate")} className="flex min-h-11 items-center gap-3 rounded-md border border-bone/15 bg-stone px-3 text-left">
          <Search className="size-4 shrink-0 text-fire" />
          <span className="flex-1"><span className="block text-sm font-medium">Investigate</span><span className="block text-xs text-mute">Guaranteed material · +20s</span></span>
        </button>
        <button type="button" onClick={() => choose("rest")} className="flex min-h-11 items-center gap-3 rounded-md border border-bone/15 bg-stone px-3 text-left">
          <Flame className="size-4 shrink-0 text-fire" />
          <span className="flex-1"><span className="block text-sm font-medium">Rest together</span><span className="block text-xs text-mute">+20 Bond XP · +10s</span></span>
        </button>
        <button type="button" onClick={() => choose("shortcut")} className="flex min-h-11 items-center gap-3 rounded-md border border-bone/15 bg-stone px-3 text-left">
          <TimerReset className="size-4 shrink-0 text-fire" />
          <span className="flex-1"><span className="block text-sm font-medium">Take the shortcut</span><span className="block text-xs text-mute">Get home 25s sooner · no bonus</span></span>
        </button>
      </div>
    </div>
  );
}

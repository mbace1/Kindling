import { useEffect, useState } from "react";
import { Flame, Search, TimerReset } from "lucide-react";
import {
  PATHS,
  SAVE_KEY,
  SPECIES,
  combatFor,
  dayKey,
  pickTelegraph,
} from "@/lib/kindling/model";
import { hasCampBuild } from "@/lib/kindling/camp-construction";
import { journeyTraitForCompanion } from "@/lib/kindling/companion-journey";
import { journeyContent } from "@/lib/kindling/world-content";
import { useKindling } from "@/lib/kindling/store";

const CHOICE_AT_MS = 31_000;
const markerPrefix = (startedAt: number) => `journey-choice:${startedAt}:`;
type ChoiceId = "investigate" | "rest" | "shortcut";

function persistCurrent() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(useKindling.getState().snapshot()));
  } catch {
    /* local play continues */
  }
}

function consequenceRoll(pathId: string, startedAt: number) {
  let h = (startedAt >>> 0) ^ 0x51ed270b;
  for (let i = 0; i < pathId.length; i++) {
    h = Math.imul(h ^ pathId.charCodeAt(i), 0x45d9f3b) >>> 0;
    h ^= h >>> 16;
  }
  return (h >>> 0) / 0x1_0000_0000;
}

export function JourneyDecision({ startedAt, pathId }: { startedAt: number; pathId: string }) {
  const s = useKindling();
  const [now, setNow] = useState(Date.now());
  const prefix = markerPrefix(startedAt);
  const resolved = s.sheet.bonus.find((entry) => entry.startsWith(prefix));
  const ready = now - startedAt >= CHOICE_AT_MS;
  const event = journeyContent(pathId);
  const hasWaymarker = hasCampBuild(s, "relic");
  const hasLens = hasCampBuild(s, "shard");
  const hasMossBed = hasCampBuild(s, "moss");
  const hasStoryStone = hasCampBuild(s, "memory");
  const hasEmberBowl = hasCampBuild(s, "ash");
  const trait = journeyTraitForCompanion(s.companion);
  const shortcutProtected = hasLens || (pathId === "ash" && hasEmberBowl);

  useEffect(() => {
    if (!s.walk || resolved || ready) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [s.walk?.startedAt, resolved, ready]);

  if (!ready || resolved || !s.walk || s.walk.startedAt !== startedAt) return null;

  const choose = (choice: ChoiceId) => {
    const current = useKindling.getState();
    const walk = current.walk;
    if (!walk || walk.startedAt !== startedAt) return;
    if (current.sheet.bonus.some((entry) => entry.startsWith(prefix))) return;

    const currentTrait = journeyTraitForCompanion(current.companion);
    const marker = `${prefix}${pathId}:${choice}`;
    const sheet = { ...current.sheet, bonus: [...current.sheet.bonus, marker] };
    const updatedAt = Date.now();

    if (choice === "investigate") {
      const path = PATHS.find((entry) => entry.id === pathId);
      const find = path?.finds.find((entry) => entry.kind === event.investigate.findKind) ?? path?.finds[0];
      if (!find || !path) return;

      const found = [
        { id: `jx${startedAt.toString(36)}`, name: find.name, kind: find.kind, from: pathId, date: dayKey() },
        ...current.found,
      ];
      let bonusCopy = "";

      if ((hasWaymarker || currentTrait?.investigateExtra) && path.finds.length > 1) {
        const primaryIndex = Math.max(0, path.finds.findIndex((entry) => entry.name === find.name && entry.kind === find.kind));
        const extra = path.finds[(primaryIndex + 1) % path.finds.length];
        found.unshift({ id: `j2${startedAt.toString(36)}`, name: extra.name, kind: extra.kind, from: pathId, date: dayKey() });
        bonusCopy = hasWaymarker
          ? ` Waymarker reveals ${extra.name}.`
          : ` ${current.companion?.name ?? "Your companion"} spots ${extra.name}.`;
      }

      let companion = current.companion;
      let roster = current.roster;
      if (hasStoryStone && find.kind === "memory" && companion) {
        companion = { ...companion, bondXp: companion.bondXp + 20 };
        roster = current.roster.map((member) => (member.id === companion?.id ? companion : member));
        bonusCopy += " Story Stone · +20 Bond XP.";
      }

      const investigateTime = Math.max(3_000, event.investigate.timeMs + (currentTrait?.investigateTimeDelta ?? 0));
      useKindling.setState({
        found,
        companion,
        roster,
        sheet,
        walk: { ...walk, endsAt: walk.endsAt + investigateTime },
        updatedAt,
        lastToast: `${event.investigate.toast} ${find.name}.${bonusCopy} +${Math.round(investigateTime / 1000)}s`,
      });
    } else if (choice === "rest") {
      const campRestBonus = (hasMossBed ? 10 : 0) + (pathId === "ash" && hasEmberBowl ? 10 : 0);
      const companionRestBonus = currentTrait?.restBondBonus ?? 0;
      const totalBond = event.rest.bondXp + campRestBonus + companionRestBonus;
      const restTime = Math.max(3_000, event.rest.timeMs + (currentTrait?.restTimeDelta ?? 0));
      const companion = current.companion
        ? { ...current.companion, bondXp: current.companion.bondXp + totalBond }
        : null;
      useKindling.setState({
        companion,
        roster: companion ? current.roster.map((member) => (member.id === companion.id ? companion : member)) : current.roster,
        sheet,
        walk: { ...walk, endsAt: walk.endsAt + restTime },
        updatedAt,
        lastToast: `${event.rest.toast} · +${totalBond} Bond XP${campRestBonus ? " · camp bonus" : ""}${companionRestBonus ? " · companion bonus" : ""} · +${Math.round(restTime / 1000)}s`,
      });
    } else {
      const path = PATHS.find((entry) => entry.id === pathId);
      const ambushChance = event.shortcut.ambushChance * (currentTrait?.ambushMultiplier ?? 1);
      const ambushed = Boolean(path?.enemy)
        && !shortcutProtected
        && consequenceRoll(pathId, startedAt) < ambushChance;

      if (ambushed && path?.enemy && current.companion) {
        const pc = combatFor(current.companion.species);
        const ec = combatFor(path.enemy);
        const guard = currentTrait?.ambushGuard ?? 0;
        useKindling.setState({
          sheet,
          walk: null,
          combat: {
            enemy: path.enemy,
            pathId,
            playerHp: pc.hp + guard,
            playerMax: pc.hp + guard,
            enemyHp: ec.hp,
            enemyMax: ec.hp,
            telegraph: pickTelegraph(path.enemy),
            log: [
              `The shortcut was watched. ${SPECIES[path.enemy].name} cuts you off.`,
              ...(guard ? [`${current.companion.name} braces first. +${guard} Guard.`] : []),
            ],
            result: null,
          },
          updatedAt,
          lastToast: "The shortcut was faster. It was not safer.",
        });
      } else {
        const shortcutTime = event.shortcut.timeMs + (currentTrait?.shortcutTimeDelta ?? 0);
        const seconds = Math.abs(Math.round(shortcutTime / 1000));
        useKindling.setState({
          sheet,
          walk: { ...walk, endsAt: Math.max(Date.now() + 3_000, walk.endsAt + shortcutTime) },
          updatedAt,
          lastToast: `${event.shortcut.toast} · −${seconds}s${shortcutProtected && event.shortcut.ambushChance > 0 ? " · route scouted" : ""}${currentTrait?.shortcutTimeDelta ? " · companion pace" : ""}`,
        });
      }
    }

    queueMicrotask(persistCurrent);
  };

  const investigateTime = Math.max(3_000, event.investigate.timeMs + (trait?.investigateTimeDelta ?? 0));
  const investigateDetail = `Guaranteed ${event.investigate.findKind} · +${Math.round(investigateTime / 1000)}s${hasWaymarker ? " · Waymarker may reveal extra" : trait?.investigateExtra ? " · companion may reveal extra" : ""}`;
  const campRestBonus = (hasMossBed ? 10 : 0) + (pathId === "ash" && hasEmberBowl ? 10 : 0);
  const companionRestBonus = trait?.restBondBonus ?? 0;
  const restTime = Math.max(3_000, event.rest.timeMs + (trait?.restTimeDelta ?? 0));
  const restDetail = `+${event.rest.bondXp + campRestBonus + companionRestBonus} Bond XP · +${Math.round(restTime / 1000)}s${campRestBonus ? " · camp bonus" : ""}${companionRestBonus ? " · companion bonus" : ""}`;
  const shortcutTime = event.shortcut.timeMs + (trait?.shortcutTimeDelta ?? 0);
  const shortcutSeconds = Math.abs(Math.round(shortcutTime / 1000));
  const baseShortcutRisk = shortcutProtected && event.shortcut.ambushChance > 0
    ? "scouted safe"
    : event.shortcut.ambushChance > 0
      ? `${Math.round(event.shortcut.ambushChance * (trait?.ambushMultiplier ?? 1) * 100)}% ambush risk`
      : "safe route";
  const shortcutDetail = `Get home ${shortcutSeconds}s sooner · ${baseShortcutRisk}`;

  return (
    <section className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-md rounded-xl border border-fire/35 bg-night/95 p-3 shadow-2xl backdrop-blur">
      <p className="text-xs uppercase tracking-[0.18em] text-fire">{event.eyebrow}</p>
      <p className="mt-1 text-sm font-medium text-bone">{event.title}</p>
      <p className="mt-0.5 text-xs text-bone/65">{event.copy}</p>
      {trait && s.companion ? (
        <p className="mt-2 rounded-md border border-fire/20 bg-coal/70 px-2.5 py-2 text-xs text-bone/75">
          <span className="font-medium text-fire">{s.companion.name} · {trait.name}</span> — {trait.summary}
        </p>
      ) : null}
      <div className="mt-3 grid gap-2">
        <button type="button" onClick={() => choose("investigate")} className="flex min-h-11 items-center gap-3 rounded-md border border-bone/15 bg-stone px-3 text-left">
          <Search className="size-4 shrink-0 text-fire" />
          <span className="flex-1"><span className="block text-sm font-medium">{event.investigate.label}</span><span className="block text-xs text-mute">{investigateDetail}</span></span>
        </button>
        <button type="button" onClick={() => choose("rest")} className="flex min-h-11 items-center gap-3 rounded-md border border-bone/15 bg-stone px-3 text-left">
          <Flame className="size-4 shrink-0 text-fire" />
          <span className="flex-1"><span className="block text-sm font-medium">{event.rest.label}</span><span className="block text-xs text-mute">{restDetail}</span></span>
        </button>
        <button type="button" onClick={() => choose("shortcut")} className="flex min-h-11 items-center gap-3 rounded-md border border-bone/15 bg-stone px-3 text-left">
          <TimerReset className="size-4 shrink-0 text-fire" />
          <span className="flex-1"><span className="block text-sm font-medium">{event.shortcut.label}</span><span className="block text-xs text-mute">{shortcutDetail}</span></span>
        </button>
      </div>
    </section>
  );
}

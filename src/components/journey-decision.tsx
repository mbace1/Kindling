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
import { useKindling } from "@/lib/kindling/store";

const CHOICE_AT_MS = 31_000;
const markerPrefix = (startedAt: number) => `journey-choice:${startedAt}:`;

type ChoiceId = "investigate" | "rest" | "shortcut";
type RoadEvent = {
  eyebrow: string;
  title: string;
  copy: string;
  investigate: { label: string; detail: string; toast: string; findIndex: number; time: number };
  rest: { label: string; detail: string; toast: string; bond: number; time: number };
  shortcut: { label: string; detail: string; toast: string; time: number; ambush: number };
};

const ROAD_EVENTS: Record<string, RoadEvent> = {
  ruin: {
    eyebrow: "Birch Ruins · broken arch",
    title: "A pale glint sits beneath a fallen stone.",
    copy: "The direct path is open, but the ruin is full of small hiding places.",
    investigate: { label: "Lift the stone", detail: "Guaranteed relic · +15s", toast: "Something was hidden under the stone.", findIndex: 0, time: 15_000 },
    rest: { label: "Sit beneath the arch", detail: "+20 Bond XP · +8s", toast: "The old stones make a quiet shelter.", bond: 20, time: 8_000 },
    shortcut: { label: "Cross the collapsed wall", detail: "Get home 20s sooner", toast: "The broken wall saves time.", time: -20_000, ambush: 0 },
  },
  forest: {
    eyebrow: "Drowned Courtyard · root pool",
    title: "Something moves under the black water.",
    copy: "Roots knot around the safer trail. The flooded middle is faster.",
    investigate: { label: "Search the roots", detail: "Guaranteed moss find · +20s", toast: "The roots were holding something soft.", findIndex: 1, time: 20_000 },
    rest: { label: "Wait by the dry roots", detail: "+30 Bond XP · +12s", toast: "You wait together until the water stills.", bond: 30, time: 12_000 },
    shortcut: { label: "Wade through", detail: "Get home 25s sooner · ambush risk", toast: "The flooded middle is cold, but quick.", time: -25_000, ambush: 0.35 },
  },
  road: {
    eyebrow: "Bell Keep · hanging banners",
    title: "A torn banner marks a narrow side stair.",
    copy: "The main road is exposed. The stair disappears behind the old wall.",
    investigate: { label: "Follow the banner thread", detail: "Guaranteed memory · +18s", toast: "The banner leads to something remembered.", findIndex: 1, time: 18_000 },
    rest: { label: "Listen at the wall", detail: "+20 Bond XP · +5s", toast: "For a moment, even the keep is quiet.", bond: 20, time: 5_000 },
    shortcut: { label: "Take the side stair", detail: "Get home 30s sooner · high ambush risk", toast: "The hidden stair cuts across the keep.", time: -30_000, ambush: 0.45 },
  },
  ash: {
    eyebrow: "Ashwood · warm fissure",
    title: "Heat breathes through a crack in the ground.",
    copy: "The ash is thin here. Something below is still warm.",
    investigate: { label: "Dig into the warm ash", detail: "Guaranteed ash find · +25s", toast: "There is still something warm beneath the ash.", findIndex: 0, time: 25_000 },
    rest: { label: "Warm yourselves here", detail: "+40 Bond XP · +15s", toast: "You stay beside the buried heat a little longer.", bond: 40, time: 15_000 },
    shortcut: { label: "Run the cooling ridge", detail: "Get home 20s sooner · ambush risk", toast: "The ridge holds long enough to cross.", time: -20_000, ambush: 0.3 },
  },
};

const FALLBACK_EVENT: RoadEvent = {
  eyebrow: "A fork in the road",
  title: "Something changes the journey.",
  copy: "Choose once. The road remembers.",
  investigate: { label: "Investigate", detail: "Guaranteed material · +20s", toast: "A closer look found something.", findIndex: 0, time: 20_000 },
  rest: { label: "Rest together", detail: "+20 Bond XP · +10s", toast: "A quiet rest.", bond: 20, time: 10_000 },
  shortcut: { label: "Take the shortcut", detail: "Get home 25s sooner · ambush risk", toast: "Shortcut taken.", time: -25_000, ambush: 0.25 },
};

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
  const event = ROAD_EVENTS[pathId] ?? FALLBACK_EVENT;
  const hasWaymarker = hasCampBuild(s, "relic");
  const hasLens = hasCampBuild(s, "shard");
  const hasMossBed = hasCampBuild(s, "moss");
  const hasStoryStone = hasCampBuild(s, "memory");
  const hasEmberBowl = hasCampBuild(s, "ash");
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

    const marker = `${prefix}${pathId}:${choice}`;
    const sheet = { ...current.sheet, bonus: [...current.sheet.bonus, marker] };
    const updatedAt = Date.now();

    if (choice === "investigate") {
      const path = PATHS.find((entry) => entry.id === pathId);
      const find = path?.finds[Math.min(event.investigate.findIndex, Math.max(0, (path?.finds.length ?? 1) - 1))];
      if (!find || !path) return;

      const found = [
        { id: `jx${startedAt.toString(36)}`, name: find.name, kind: find.kind, from: pathId, date: dayKey() },
        ...current.found,
      ];
      let bonusCopy = "";

      if (hasWaymarker && path.finds.length > 1) {
        const extraIndex = (event.investigate.findIndex + 1) % path.finds.length;
        const extra = path.finds[extraIndex];
        found.unshift({ id: `j2${startedAt.toString(36)}`, name: extra.name, kind: extra.kind, from: pathId, date: dayKey() });
        bonusCopy = ` Waymarker reveals ${extra.name}.`;
      }

      let companion = current.companion;
      let roster = current.roster;
      if (hasStoryStone && find.kind === "memory" && companion) {
        companion = { ...companion, bondXp: companion.bondXp + 20 };
        roster = current.roster.map((member) => (member.id === companion?.id ? companion : member));
        bonusCopy += " Story Stone · +20 Bond XP.";
      }

      useKindling.setState({
        found,
        companion,
        roster,
        sheet,
        walk: { ...walk, endsAt: walk.endsAt + event.investigate.time },
        updatedAt,
        lastToast: `${event.investigate.toast} ${find.name}.${bonusCopy} +${Math.round(event.investigate.time / 1000)}s`,
      });
    } else if (choice === "rest") {
      const restBonus = (hasMossBed ? 10 : 0) + (pathId === "ash" && hasEmberBowl ? 10 : 0);
      const totalBond = event.rest.bond + restBonus;
      const companion = current.companion
        ? { ...current.companion, bondXp: current.companion.bondXp + totalBond }
        : null;
      useKindling.setState({
        companion,
        roster: companion ? current.roster.map((member) => (member.id === companion.id ? companion : member)) : current.roster,
        sheet,
        walk: { ...walk, endsAt: walk.endsAt + event.rest.time },
        updatedAt,
        lastToast: `${event.rest.toast} · +${totalBond} Bond XP${restBonus ? " · camp bonus" : ""} · +${Math.round(event.rest.time / 1000)}s`,
      });
    } else {
      const path = PATHS.find((entry) => entry.id === pathId);
      const ambushed = Boolean(path?.enemy)
        && !shortcutProtected
        && consequenceRoll(pathId, startedAt) < event.shortcut.ambush;

      if (ambushed && path?.enemy && current.companion) {
        const pc = combatFor(current.companion.species);
        const ec = combatFor(path.enemy);
        useKindling.setState({
          sheet,
          walk: null,
          combat: {
            enemy: path.enemy,
            pathId,
            playerHp: pc.hp,
            playerMax: pc.hp,
            enemyHp: ec.hp,
            enemyMax: ec.hp,
            telegraph: pickTelegraph(path.enemy),
            log: [`The shortcut was watched. ${SPECIES[path.enemy].name} cuts you off.`],
            result: null,
          },
          updatedAt,
          lastToast: "The shortcut was faster. It was not safer.",
        });
      } else {
        const seconds = Math.abs(Math.round(event.shortcut.time / 1000));
        useKindling.setState({
          sheet,
          walk: { ...walk, endsAt: Math.max(Date.now() + 3_000, walk.endsAt + event.shortcut.time) },
          updatedAt,
          lastToast: `${event.shortcut.toast} · −${seconds}s${shortcutProtected && event.shortcut.ambush > 0 ? " · route scouted" : ""}`,
        });
      }
    }

    queueMicrotask(persistCurrent);
  };

  const investigateDetail = `${event.investigate.detail}${hasWaymarker ? " · Waymarker may reveal extra" : ""}`;
  const restBonus = (hasMossBed ? 10 : 0) + (pathId === "ash" && hasEmberBowl ? 10 : 0);
  const restDetail = `${event.rest.detail}${restBonus ? ` · +${restBonus} camp bonus` : ""}`;
  const shortcutDetail = shortcutProtected && event.shortcut.ambush > 0
    ? `${event.shortcut.detail.replace(/ · .*ambush risk/, "")} · scouted safe`
    : event.shortcut.detail;

  return (
    <section className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-md rounded-xl border border-fire/35 bg-night/95 p-3 shadow-2xl backdrop-blur">
      <p className="text-xs uppercase tracking-[0.18em] text-fire">{event.eyebrow}</p>
      <p className="mt-1 text-sm font-medium text-bone">{event.title}</p>
      <p className="mt-0.5 text-xs text-bone/65">{event.copy}</p>
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
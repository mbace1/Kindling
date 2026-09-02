import { useEffect, useRef, useState } from "react";
import { Flame, LockKeyhole } from "lucide-react";
import {
  ERRAND_COST,
  FLAMES_PER_FUEL,
  SPECIES,
  assetSrc,
  verbLabel,
  type SpeciesId,
} from "@/lib/kindling/model";
import { unlockedFindKinds } from "@/lib/kindling/find-progression";
import { useKindling } from "@/lib/kindling/store";
import {
  OLD_GATE,
  WORLD_PATHS,
  oldGateVisible,
  pathCleared,
  pathUnlocked,
  worldProgress,
} from "@/lib/kindling/world";
import { cn } from "@/lib/utils";
import { UiAtlasSprite } from "@/components/ui-atlas-sprite";
import { CompanionAtlasSprite, type CompanionAtlasMode } from "@/components/ember-atlas-sprite";

const JOURNEY_FLAMES = ERRAND_COST * FLAMES_PER_FUEL;
const JOURNEY_SECONDS = 90;
const DECISION_AT_MS = 31_000;

const JOURNEY_MOMENTS = [
  { at: 0.18, title: "Tracks in the path", copy: "Something small passed this way recently." },
  { at: 0.46, title: "A warm trace", copy: "A little heat remains under the stones." },
  { at: 0.74, title: "Something ahead", copy: "The road goes quiet. Keep moving." },
] as const;

function journeyProgress(startedAt: number, endsAt: number, now: number) {
  const elapsed = Math.max(0, now - startedAt);
  const baseDuration = JOURNEY_SECONDS * 1000;
  const choiceProgress = DECISION_AT_MS / baseDuration;
  if (elapsed <= DECISION_AT_MS) return Math.min(choiceProgress, elapsed / baseDuration);
  const postChoiceDuration = Math.max(1, endsAt - startedAt - DECISION_AT_MS);
  const postChoiceElapsed = Math.max(0, elapsed - DECISION_AT_MS);
  return Math.max(0, Math.min(1, choiceProgress + (1 - choiceProgress) * (postChoiceElapsed / postChoiceDuration)));
}

function counterTo(intent: "strike" | "guard" | "skill") {
  if (intent === "strike") return "guard";
  if (intent === "guard") return "skill";
  return "strike";
}

function journeyChoice(markers: string[], startedAt: number) {
  const marker = markers.find((entry) => entry.startsWith(`journey-choice:${startedAt}:`));
  if (!marker) return null;
  const choice = marker.split(":").at(-1);
  return choice === "investigate" || choice === "rest" || choice === "shortcut" ? choice : null;
}

function JourneyAtmosphere({ choice, pathId }: { choice: "investigate" | "rest" | "shortcut" | null; pathId: string }) {
  if (!choice) return null;
  if (choice === "investigate") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{ background: pathId === "ash" ? "radial-gradient(circle at 58% 66%, rgba(255,134,65,.32), transparent 27%)" : "radial-gradient(circle at 56% 64%, rgba(210,229,196,.22), transparent 25%)" }}
      />
    );
  }
  if (choice === "rest") {
    return <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_72%,rgba(255,181,78,0.18),transparent_36%)]" />;
  }
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-20"
      style={{ backgroundImage: "repeating-linear-gradient(112deg, transparent 0 34px, rgba(234,224,201,.22) 35px 37px, transparent 38px 72px)" }}
    />
  );
}

export function JourneyWorldScreen() {
  const s = useKindling();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!s.walk) return;
    const update = window.setInterval(() => setNow(Date.now()), 250);
    const wait = Math.max(0, s.walk.endsAt - Date.now());
    const finish = window.setTimeout(() => useKindling.getState().finishWalk(), wait + 40);
    return () => {
      window.clearInterval(update);
      window.clearTimeout(finish);
    };
  }, [s.walk]);

  if (s.combat) return <CombatWorldScreen />;

  if (s.walk) {
    const path = WORLD_PATHS.find((p) => p.id === s.walk?.pathId);
    const remainingMs = Math.max(0, s.walk.endsAt - now);
    const seconds = Math.ceil(remainingMs / 1000);
    const travel = journeyProgress(s.walk.startedAt, s.walk.endsAt, now);
    const left = 10 + travel * 72;
    const step = Math.floor(now / 240) % 2;
    const bob = step === 0 ? 0 : -4;
    const lean = step === 0 ? -1.5 : 1.5;
    const moment = [...JOURNEY_MOMENTS].reverse().find((entry) => travel >= entry.at);
    const choice = journeyChoice(s.sheet.bonus, s.walk.startedAt);
    const mode: CompanionAtlasMode = choice === "investigate" ? "curious" : "walk";
    return (
      <div className="relative min-h-[70vh] overflow-hidden">
        <div className="relative h-[50vh] min-h-[340px] max-h-[500px] overflow-hidden border-y border-bone/10 sm:h-80 sm:min-h-0 sm:max-h-none">
          <img
            src={assetSrc(path?.art ?? "art/path.png")}
            alt=""
            className="h-full w-full scale-[1.02] object-cover"
            style={{ objectPosition: path?.crop ?? "50% center" }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-night/10 via-transparent to-night/90" />
          <JourneyAtmosphere choice={choice} pathId={path?.id ?? ""} />
          {choice === "rest" ? (
            <div aria-hidden="true" className="absolute bottom-[12%] left-1/2 h-16 w-16 -translate-x-1/2 rounded-full bg-fire/10 blur-xl" />
          ) : null}
          {s.companion ? (
            <div
              className="absolute bottom-8 -translate-x-1/2 transition-[left] duration-300 ease-linear sm:bottom-10"
              style={{ left: `${left}%`, transform: `translateX(-50%) translateY(${choice === "rest" ? 1 : bob}px) rotate(${choice === "rest" ? 0 : lean}deg)` }}
            >
              <CompanionAtlasSprite
                species={s.companion.species}
                mode={choice === "rest" ? "warm" : mode}
                className="h-20 w-20 origin-bottom drop-shadow-[0_7px_5px_rgba(0,0,0,0.45)] sm:h-24 sm:w-24"
              />
            </div>
          ) : null}
          {moment ? (
            <div className="absolute inset-x-4 bottom-3 rounded-lg border border-bone/15 bg-night/82 px-3 py-2 shadow-xl backdrop-blur-[3px] sm:left-auto sm:right-4 sm:w-72">
              <p className="text-xs uppercase tracking-[0.16em] text-fire">On the road</p>
              <p className="mt-0.5 text-sm font-medium text-bone">{moment.title}</p>
              <p className="text-xs text-bone/65">{moment.copy}</p>
              {choice ? <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-fire/80">{choice} changed the road</p> : null}
            </div>
          ) : null}
        </div>
        <div className="space-y-2 px-4 py-5 sm:px-5 sm:py-6">
          <p className="text-xs uppercase tracking-[0.2em] text-mute">Chapter {path?.chapter ?? "?"} · {path?.displayName ?? "The path"}</p>
          <h2 className="font-display text-2xl">{s.companion?.name ?? "Someone"} is on the path.</h2>
          <div className="h-1.5 overflow-hidden rounded-full bg-stone shadow-inner">
            <div className="h-full bg-fire transition-[width] duration-300 ease-linear" style={{ width: `${travel * 100}%` }} />
          </div>
          <p className="text-sm text-mute">{seconds > 0 ? `${seconds}s · continues if you close the app.` : "Coming home."}</p>
        </div>
      </div>
    );
  }

  const progress = worldProgress(s);
  const oldGate = oldGateVisible(s);
  const coverPath = [...WORLD_PATHS].reverse().find((path) => pathUnlocked(s, path)) ?? WORLD_PATHS[0];
  const findKinds = unlockedFindKinds(s);
  const hasWaymarker = findKinds.has("relic");
  const hasLens = findKinds.has("shard");

  return (
    <div>
      <div className="relative h-[38vh] min-h-72 max-h-[360px] overflow-hidden border-y border-bone/10 sm:h-52 sm:min-h-0 sm:max-h-none">
        <img src={assetSrc(coverPath.art)} alt="" className="h-full w-full object-cover" style={{ objectPosition: coverPath.crop }} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-night" />
        <div className="absolute bottom-4 left-4 rounded-md border border-bone/15 bg-night/75 px-3 py-2 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-[0.18em] text-fire">Farthest known road</p>
          <p className="font-display text-lg">{coverPath.displayName}</p>
        </div>
      </div>

      <div className="px-4 pt-4">
        <p className="text-xs uppercase tracking-[0.2em] text-mute">Journey</p>
        <h2 className="font-display text-2xl font-semibold">The road keeps opening.</h2>
      </div>

      <div className="space-y-4 px-4 pb-28 pt-4">
        <div className="rounded-xl border border-ash/80 bg-gradient-to-b from-stone/80 to-coal/70 p-3 sm:flex sm:items-start sm:justify-between sm:gap-4">
          <p className="text-sm text-mute">{JOURNEY_FLAMES} Flames · about 90 seconds. Bring something home to open the next region.</p>
          <p className="mt-2 text-xs text-mute sm:mt-0 sm:shrink-0 sm:text-right">{progress.cleared} / {progress.total} roads known</p>
        </div>

        {(hasWaymarker || hasLens) ? (
          <div className="flex flex-wrap gap-2 text-xs">
            {hasWaymarker ? <span className="rounded-full border border-fire/30 bg-coal px-2.5 py-1 text-fire">Waymarker · finds revealed</span> : null}
            {hasLens ? <span className="rounded-full border border-fire/30 bg-coal px-2.5 py-1 text-fire">Glass Lens · danger revealed</span> : null}
          </div>
        ) : null}

        <div className="space-y-2">
          {WORLD_PATHS.map((path) => {
            const unlocked = pathUnlocked(s, path);
            const cleared = pathCleared(s, path.id);
            const enough = s.fuel >= ERRAND_COST;
            const findNames = path.finds.map((find) => find.name.replace(/^a |^an /, "")).join(" · ");
            return (
              <button
                key={path.id}
                type="button"
                disabled={!s.companion || !unlocked || !enough}
                onClick={() => s.startWalk(path.id)}
                className={cn(
                  "relative flex min-h-20 w-full items-center justify-between gap-3 overflow-hidden rounded-xl border px-4 py-3 text-left shadow-[0_10px_28px_rgba(0,0,0,0.14)] transition",
                  cleared ? "border-fire/35 bg-coal" : "border-ash bg-stone",
                  unlocked && enough && "hover:border-fire/45",
                  !unlocked && "opacity-55",
                )}
                aria-label={path.displayName}
              >
                <span className="absolute inset-y-0 left-0 w-1 bg-fire/35" />
                <span className="min-w-0 pl-1">
                  <span className="flex items-center gap-2">
                    {!unlocked ? <LockKeyhole className="size-3.5 shrink-0 text-mute" /> : null}
                    <span className="font-medium">{path.chapter}. {path.displayName}</span>
                  </span>
                  <span className={cn("mt-0.5 text-sm text-mute", !unlocked ? "hidden sm:block" : "block")}>
                    {!unlocked
                      ? `Bring something home from ${WORLD_PATHS[path.chapter - 2]?.displayName ?? "the previous road"}.`
                      : cleared
                        ? "Known path · return whenever you want."
                        : path.worldBlurb}
                  </span>
                  {unlocked && hasWaymarker ? <span className="mt-1 block text-xs text-bone/55">May hold · {findNames}</span> : null}
                  {unlocked && hasLens ? <span className="mt-1 block text-xs text-bone/55">Encounter risk · {Math.round(path.encounter * 100)}%</span> : null}
                </span>
                <span className="shrink-0 text-right text-xs">
                  {cleared ? <span className="text-fire">CLEARED</span> : null}
                  <span className="mt-1 flex items-center justify-end gap-1 text-fire"><Flame className="size-3.5" /> {JOURNEY_FLAMES}</span>
                </span>
              </button>
            );
          })}

          <div className={cn("rounded-xl border border-ash bg-gradient-to-b from-stone to-coal px-4 py-3", oldGate ? "opacity-90" : "opacity-45")}>
            <div className="flex items-center gap-2">
              <LockKeyhole className="size-3.5 text-mute" />
              <p className="font-medium">{OLD_GATE.chapter}. {OLD_GATE.displayName}</p>
            </div>
            <p className="mt-1 hidden text-sm text-mute sm:block">{oldGate ? "The gate is visible beyond Ashwood. It does not open yet." : OLD_GATE.worldBlurb}</p>
          </div>
        </div>

        {s.fuel < ERRAND_COST ? <p className="text-sm text-mute">Tend the fire a little more, then journey.</p> : null}
      </div>
    </div>
  );
}

function CombatWorldScreen() {
  const s = useKindling();
  const c = s.combat;
  const previousPlayerHp = useRef(c?.playerHp ?? 0);
  const previousEnemyHp = useRef(c?.enemyHp ?? 0);
  const [playerDamage, setPlayerDamage] = useState(0);
  const [enemyDamage, setEnemyDamage] = useState(0);

  useEffect(() => {
    if (!c) return;
    const p = Math.max(0, previousPlayerHp.current - c.playerHp);
    const e = Math.max(0, previousEnemyHp.current - c.enemyHp);
    previousPlayerHp.current = c.playerHp;
    previousEnemyHp.current = c.enemyHp;
    if (p) {
      setPlayerDamage(p);
      const timer = window.setTimeout(() => setPlayerDamage(0), 520);
      return () => window.clearTimeout(timer);
    }
    if (e) {
      setEnemyDamage(e);
      const timer = window.setTimeout(() => setEnemyDamage(0), 520);
      return () => window.clearTimeout(timer);
    }
  }, [c?.playerHp, c?.enemyHp]);

  if (!c || !s.companion) return null;
  const enemy = SPECIES[c.enemy];
  const path = WORLD_PATHS.find((p) => p.id === c.pathId);
  const done = Boolean(c.result);
  const recommended = counterTo(c.telegraph);

  return (
    <div className="relative min-h-[72vh] overflow-hidden pb-28">
      {path ? (
        <img src={assetSrc(path.art)} alt="" className="absolute inset-0 h-full w-full scale-[1.03] object-cover opacity-65" style={{ objectPosition: path.crop }} />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-night/35 via-night/68 to-night" />
      <div className="relative z-10 px-4 pt-4">
        <p className="text-xs uppercase tracking-[0.2em] text-bone/65">{path ? `Chapter ${path.chapter} · ${path.displayName}` : "On the path"}</p>
        <h2 className="font-display text-3xl font-semibold">{enemy.name}</h2>
        <p className="text-sm text-bone/70">{enemy.blurb}</p>

        <div className="mt-5 flex items-end justify-between gap-3 rounded-xl border border-bone/10 bg-night/45 px-3 pb-3 pt-4 shadow-2xl backdrop-blur-[2px] sm:mt-6 sm:gap-5 sm:pt-5">
          <Fighter name={s.companion.name} species={s.companion.species} hp={c.playerHp} max={c.playerMax} align="left" damage={playerDamage} result={c.result} />
          <Fighter name={enemy.name} species={c.enemy} hp={c.enemyHp} max={c.enemyMax} align="right" pose={c.result ? undefined : c.telegraph} damage={enemyDamage} result={c.result === "win" ? "lose" : c.result === "lose" ? "win" : null} />
        </div>

        {!done ? (
          <div className="mt-3 rounded-lg border border-fire/25 bg-night/78 px-3 py-2 text-sm shadow-lg">
            <span className="text-mute">Intent · </span><span className="font-medium text-bone">{verbLabel(c.telegraph)}</span>
            <span className="ml-2 rounded-full bg-fire/10 px-2 py-0.5 text-xs text-fire">Counter: {verbLabel(recommended)}</span>
            <p className="mt-1 text-[11px] text-bone/55">{enemy.combat.tendency.replace("-", " ")} · read the intent, then answer it.</p>
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-fire/20 bg-coal/75 px-3 py-2 text-sm font-medium text-bone">{c.result === "win" ? "The path opens." : "You walk home. The fire is still there."}</p>
        )}

        {c.log.length ? (
          <div className="mt-3 rounded-lg border border-bone/10 bg-night/55 p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-fire">Latest exchange</p>
            <p className="mt-1 text-sm text-bone/80">{c.log[0]}</p>
            {c.log.slice(1, 4).map((line, i) => <p key={i} className="mt-1 text-xs text-bone/45">{line}</p>)}
          </div>
        ) : null}

        {done ? (
          <div className="mt-6 space-y-2">
            {c.result === "win" && SPECIES[c.enemy].capturable && s.roster.length < 6 && !s.roster.some((m) => m.species === c.enemy) ? (
              <button type="button" onClick={() => s.keepEncounter()} className="min-h-12 w-full rounded-md bg-fire px-4 font-medium text-night">Keep them by the fire</button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                const lost = c.result === "lose";
                s.leaveCombat();
                if (lost) queueMicrotask(() => useKindling.getState().setTab("today"));
              }}
              className="min-h-12 w-full rounded-md border border-bone/20 bg-night/75 px-4 font-medium"
            >
              {c.result === "lose" ? "Return to the fire" : "Back to the paths"}
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-3 gap-2">
            {([
              { verb: "strike", x: 548 },
              { verb: "guard", x: 736 },
              { verb: "skill", x: 900 },
            ] as const).map(({ verb, x }) => {
              const isCounter = verb === recommended;
              return (
                <button
                  key={verb}
                  type="button"
                  onClick={() => s.playerAct(verb)}
                  className={cn(
                    "relative grid min-h-28 place-items-center overflow-hidden rounded-xl border pb-2 pt-4 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fire",
                    isCounter ? "border-fire bg-fire/10 shadow-[0_0_22px_rgba(255,181,78,0.12)]" : "border-bone/10 bg-night/35 opacity-78",
                  )}
                  aria-label={`${verbLabel(verb)}${isCounter ? " · recommended counter" : ""}`}
                >
                  {isCounter ? <span className="absolute left-1/2 top-1 -translate-x-1/2 rounded-full bg-fire px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-night">Counter</span> : null}
                  <UiAtlasSprite x={x} y={672} width={134} height={127} displayWidth={82} className={isCounter ? "scale-105" : "scale-95"} />
                  <span className={cn("text-xs font-semibold uppercase tracking-[0.12em]", isCounter ? "text-fire" : "text-bone/65")}>{verbLabel(verb)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Fighter({ name, species, hp, max, align, pose, damage, result }: {
  name: string;
  species: SpeciesId;
  hp: number;
  max: number;
  align: "left" | "right";
  pose?: "strike" | "guard" | "skill";
  damage: number;
  result: null | "win" | "lose";
}) {
  const low = hp / max < 0.35;
  const mode: CompanionAtlasMode = result === "win" ? "victory" : damage ? "hit" : low ? "low" : pose === "skill" ? "curious" : "warm";
  return (
    <div className={cn("relative min-w-0 flex-1", align === "right" && "text-right")}>
      {damage ? <span className="absolute left-1/2 top-1 z-10 -translate-x-1/2 animate-[bounce_520ms_ease-out_1] rounded-full bg-night/90 px-2 py-1 text-sm font-bold text-fire">−{damage}</span> : null}
      <div className={cn("mx-auto h-28 w-28 transition-transform duration-200 sm:h-32 sm:w-32", pose === "strike" && (align === "right" ? "-translate-x-2 scale-105" : "translate-x-2 scale-105"), pose === "guard" && "scale-x-105")}> 
        <CompanionAtlasSprite species={species} mode={mode} className="h-full w-full drop-shadow-[0_8px_6px_rgba(0,0,0,0.5)]" />
      </div>
      <p className="mt-1 truncate text-sm font-medium">{name}</p>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-night/80 shadow-inner"><div className="h-full bg-fire transition-[width] duration-300" style={{ width: `${Math.max(0, (hp / max) * 100)}%` }} /></div>
      <p className="mt-1 text-xs text-bone/60">{hp} / {max}</p>
    </div>
  );
}

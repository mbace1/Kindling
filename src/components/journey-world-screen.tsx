import { useEffect, useState } from "react";
import { Flame, LockKeyhole } from "lucide-react";
import {
  ERRAND_COST,
  FLAMES_PER_FUEL,
  SPECIES,
  assetSrc,
  portraitSrc,
  verbLabel,
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
import { CompanionAtlasSprite } from "@/components/ember-atlas-sprite";

const JOURNEY_FLAMES = ERRAND_COST * FLAMES_PER_FUEL;
const JOURNEY_SECONDS = 90;

const JOURNEY_MOMENTS = [
  { at: 0.18, title: "Tracks in the path", copy: "Something small passed this way recently." },
  { at: 0.46, title: "A warm trace", copy: "A little heat remains under the stones." },
  { at: 0.74, title: "Something ahead", copy: "The road goes quiet. Keep moving." },
] as const;

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
    const travel = Math.max(0, Math.min(1, (JOURNEY_SECONDS * 1000 - remainingMs) / (JOURNEY_SECONDS * 1000)));
    const left = 10 + travel * 72;
    const step = Math.floor(now / 240) % 2;
    const bob = step === 0 ? 0 : -4;
    const lean = step === 0 ? -1.5 : 1.5;
    const moment = [...JOURNEY_MOMENTS].reverse().find((entry) => travel >= entry.at);
    return (
      <div className="relative min-h-[70vh] overflow-hidden">
        <div className="relative h-[50vh] min-h-[340px] max-h-[500px] overflow-hidden sm:h-80 sm:min-h-0 sm:max-h-none">
          <img
            src={assetSrc(path?.art ?? "art/path.png")}
            alt=""
            className="h-full w-full scale-105 object-cover"
            style={{ objectPosition: path?.crop ?? "50% center" }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-night/5 via-transparent to-night" />
          {s.companion && path?.id !== "ruin" ? (
            <div
              className="absolute bottom-8 -translate-x-1/2 transition-[left] duration-300 ease-linear sm:bottom-10"
              style={{ left: `${left}%`, transform: `translateX(-50%) translateY(${bob}px) rotate(${lean}deg)` }}
            >
              <CompanionAtlasSprite
                species={s.companion.species}
                mode="walk"
                className="h-20 w-20 origin-bottom drop-shadow-[0_5px_3px_rgba(0,0,0,0.35)] sm:h-24 sm:w-24"
              />
            </div>
          ) : null}
          {moment ? (
            <div className="absolute inset-x-4 bottom-3 rounded-md border border-bone/15 bg-night/80 px-3 py-2 backdrop-blur-[2px] sm:left-auto sm:right-4 sm:w-72">
              <p className="text-xs uppercase tracking-[0.16em] text-fire">On the road</p>
              <p className="mt-0.5 text-sm font-medium text-bone">{moment.title}</p>
              <p className="text-xs text-bone/65">{moment.copy}</p>
            </div>
          ) : null}
        </div>
        <div className="space-y-2 px-4 py-5 sm:px-5 sm:py-6">
          <p className="text-xs uppercase tracking-[0.2em] text-mute">Chapter {path?.chapter ?? "?"} · {path?.displayName ?? "The path"}</p>
          <h2 className="font-display text-2xl">{s.companion?.name ?? "Someone"} is on the path.</h2>
          <div className="h-1.5 overflow-hidden rounded-full bg-stone">
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
      <div className="relative h-[38vh] min-h-72 max-h-[360px] overflow-hidden sm:h-52 sm:min-h-0 sm:max-h-none">
        <img src={assetSrc(coverPath.art)} alt="" className="h-full w-full object-cover" style={{ objectPosition: coverPath.crop }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-night to-transparent" />
      </div>

      <div className="px-4 pt-3">
        <p className="text-xs uppercase tracking-[0.2em] text-mute">Journey</p>
        <h2 className="font-display text-2xl font-semibold">The road keeps opening.</h2>
      </div>

      <div className="space-y-4 px-4 pb-28 pt-4">
        <div className="rounded-lg border border-ash/80 bg-stone/65 p-3 sm:flex sm:items-start sm:justify-between sm:gap-4 sm:border-0 sm:bg-transparent sm:p-0">
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
                  "flex min-h-16 w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left sm:min-h-20 sm:gap-4",
                  cleared ? "border-fire/35 bg-coal" : "border-ash bg-stone",
                  !unlocked && "opacity-55",
                )}
                aria-label={path.displayName}
              >
                <span className="min-w-0">
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

          <div className={cn("rounded-lg border border-ash bg-stone px-4 py-3", oldGate ? "opacity-90" : "opacity-45")}>
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
  if (!c || !s.companion) return null;
  const enemy = SPECIES[c.enemy];
  const path = WORLD_PATHS.find((p) => p.id === c.pathId);
  const done = Boolean(c.result);

  return (
    <div className="relative min-h-[72vh] overflow-hidden pb-28">
      {path ? (
        <img
          src={assetSrc(path.art)}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-55"
          style={{ objectPosition: path.crop }}
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-night/40 via-night/65 to-night" />
      <div className="relative z-10 px-4 pt-4">
      <p className="text-xs uppercase tracking-[0.2em] text-bone/65">{path ? `Chapter ${path.chapter} · ${path.displayName}` : "On the path"}</p>
      <h2 className="font-display text-3xl font-semibold">{enemy.name}</h2>
      <p className="text-sm text-bone/70">{enemy.blurb}</p>

      <div className="mt-5 flex items-end justify-between gap-3 rounded-lg border border-bone/10 bg-night/35 px-3 pb-3 pt-4 backdrop-blur-[1px] sm:mt-6 sm:gap-5 sm:pt-5">
        <Fighter name={s.companion.name} src={portraitSrc(s.companion.species)} hp={c.playerHp} max={c.playerMax} align="left" />
        <Fighter name={enemy.name} src={portraitSrc(c.enemy)} hp={c.enemyHp} max={c.enemyMax} align="right" pose={c.result ? undefined : c.telegraph} />
      </div>

      {!done ? (
        <div className="mt-3 rounded-md border border-fire/25 bg-night/70 px-3 py-2 text-sm"><span className="text-mute">Intent · </span><span className="font-medium text-bone">{verbLabel(c.telegraph)}</span></div>
      ) : (
        <p className="mt-4 text-sm font-medium text-bone">{c.result === "win" ? "The path opens." : "You walk home. The fire is still there."}</p>
      )}

      <ul className="mt-3 space-y-1 text-sm text-bone/65">{c.log.map((line, i) => <li key={i}>{line}</li>)}</ul>

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
          ] as const).map(({ verb, x }) => (
            <button
              key={verb}
              type="button"
              onClick={() => s.playerAct(verb)}
              className="grid min-h-24 place-items-center overflow-hidden rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fire"
              aria-label={verbLabel(verb)}
            >
              <UiAtlasSprite x={x} y={672} width={134} height={127} displayWidth={108} />
            </button>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function Fighter({ name, src, hp, max, align, pose }: {
  name: string;
  src: string;
  hp: number;
  max: number;
  align: "left" | "right";
  pose?: "strike" | "guard" | "skill";
}) {
  return (
    <div className={cn("min-w-0 flex-1", align === "right" && "text-right")}>
      <img
        src={src}
        alt=""
        className={cn(
          "mx-auto h-28 w-28 object-contain transition-transform duration-300 sm:h-32 sm:w-32",
          pose === "strike" && (align === "right" ? "-translate-x-2 scale-110" : "translate-x-2 scale-110"),
          pose === "guard" && "scale-x-110",
          pose === "skill" && "scale-110",
        )}
      />
      <p className="mt-1 truncate text-sm font-medium">{name}</p>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-night/80"><div className="h-full bg-fire" style={{ width: `${Math.max(0, (hp / max) * 100)}%` }} /></div>
      <p className="mt-1 text-xs text-bone/60">{hp} / {max}</p>
    </div>
  );
}

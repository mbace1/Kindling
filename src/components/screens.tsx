import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Flame,
  Plus,
  Wind,
  X,
} from "lucide-react";
import { CampCanvas } from "@/components/camp-canvas";
import {
  ERRAND_COST,
  FLAMES_PER_FUEL,
  FULL_DAY,
  MOODS,
  PATHS,
  PRESET_TASKS,
  SPECIES,
  assetSrc,
  bondUnits,
  caredToday,
  consecutiveMissed,
  eggReady,
  eggWarmth,
  flames,
  formatDay,
  nextStageBondXp,
  pairings,
  portraitSrc,
  progressiveOpportunities,
  stageOf,
  stageOfCompanion,
  verbLabel,
  warningState,
  warmth,
  type Mood,
  type SpeciesId,
} from "@/lib/kindling/model";
import { useKindling } from "@/lib/kindling/store";
import { cn } from "@/lib/utils";

const JOURNEY_FLAMES = ERRAND_COST * FLAMES_PER_FUEL;

export function TodayScreen() {
  const s = useKindling();
  const cared = caredToday(s);
  const fireDone = Math.min(FULL_DAY, cared);
  const heat = warmth(s);
  const warn = warningState(s);
  const stage = stageOf(s);
  const nextBond = nextStageBondXp(s);
  const progressive = progressiveOpportunities(s);

  return (
    <div>
      <CampCanvas save={s} tall />
      <div className="space-y-5 px-4 pb-28 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-mute">
              {warn ? "The fire is fading." : fireDone >= FULL_DAY ? "Fire tended. Enough for today." : "Today"}
            </p>
            <h2 className="font-display text-2xl font-semibold">
              {fireDone} / {FULL_DAY} tended
            </h2>
            <p className="text-sm text-mute">
              {s.tasks.length} on your list
              {s.companion ? ` · ${s.companion.name} is ${stage.name}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1 text-fire">
              <Flame className="size-4" />
              <span className="font-medium">{flames(s)}</span>
            </p>
            <p className="text-xs text-mute">Flames</p>
            {s.companion ? (
              <p className="mt-1 text-xs text-mute">
                {s.companion.bondXp} Bond XP{nextBond ? ` · ${nextBond} to next form` : ""}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: FULL_DAY }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-2 flex-1 rounded-full",
                fireDone > i ? "bg-fire" : "bg-ash",
              )}
            />
          ))}
        </div>

        {fireDone >= FULL_DAY ? (
          <p className="text-sm text-mute">The fire stays full. Anything else today is optional.</p>
        ) : null}

        {!s.walkedOnce && s.fuel >= ERRAND_COST && s.companion ? (
          <button
            type="button"
            onClick={() => s.setTab("journey")}
            className="w-full rounded-md border border-fire/40 bg-coal px-4 py-3 text-left"
          >
            <p className="font-medium text-fire">The path is open.</p>
            <p className="text-sm text-mute">{JOURNEY_FLAMES} Flames sends them out for a while.</p>
          </button>
        ) : null}

        <section className="space-y-2">
          {s.tasks.map((task) => {
            const on = s.sheet.done.includes(task.id);
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => s.toggleTask(task.id)}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition",
                  on
                    ? "border-fire/40 bg-coal/60 text-bone"
                    : "border-ash bg-stone text-bone hover:border-mute",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border",
                    on ? "border-fire bg-fire text-night" : "border-mute/50",
                  )}
                >
                  {on ? <Check className="size-4" /> : null}
                </span>
                <span className="flex-1 text-base font-medium">{task.text}</span>
                {!s.sheet.paid.includes(task.id) && !on ? (
                  <span className="text-xs text-mute">+20 Flames</span>
                ) : null}
              </button>
            );
          })}
        </section>

        {progressive.length ? (
          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-mute">Optional · go further</p>
            {progressive.map(({ task, tier }) => (
              <button
                key={`${task.id}:${tier.id}`}
                type="button"
                onClick={() => s.completeProgressive(task.id)}
                className="flex min-h-16 w-full items-center justify-between gap-4 rounded-md border border-fire/35 bg-coal px-4 py-3 text-left"
              >
                <span>
                  <span className="block font-medium">{tier.label}</span>
                  <span className="text-xs text-mute">Only if you want to.</span>
                </span>
                <span className="shrink-0 text-right text-xs text-fire">
                  +{tier.flames} Flames
                  <br />+{tier.bondXp} Bond
                </span>
              </button>
            ))}
          </section>
        ) : null}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => s.setEditingGoals(true)}
            className="min-h-12 flex-1 rounded-md border border-ash bg-stone px-3 text-sm text-mute"
          >
            Edit the list
          </button>
          <button
            type="button"
            onClick={() => s.setBreatheOpen(true)}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md border border-ash bg-stone px-3 text-sm text-bone"
          >
            <Wind className="size-4 text-mute" />
            Breathe
          </button>
        </div>

        <section>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-mute">How is it</p>
          <div className="flex gap-1.5">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => s.setMood(m.id)}
                className={cn(
                  "min-h-12 flex-1 rounded-md border text-xs font-medium",
                  s.sheet.mood === m.id
                    ? "border-fire bg-coal text-bone"
                    : "border-ash bg-stone text-mute",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function JourneyScreen() {
  const s = useKindling();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!s.walk) return;
    const update = window.setInterval(() => setNow(Date.now()), 1000);
    const wait = Math.max(0, s.walk.endsAt - Date.now());
    const finish = window.setTimeout(() => useKindling.getState().finishWalk(), wait + 40);
    return () => {
      window.clearInterval(update);
      window.clearTimeout(finish);
    };
  }, [s.walk]);

  if (s.combat) return <CombatScreen />;

  if (s.walk) {
    const path = PATHS.find((p) => p.id === s.walk?.pathId);
    const seconds = Math.max(0, Math.ceil((s.walk.endsAt - now) / 1000));
    return (
      <div className="relative min-h-[70vh] overflow-hidden">
        <img
          src={assetSrc("art/path.webp")}
          alt=""
          className="h-64 w-full scale-105 object-cover sm:h-80"
          style={{ objectPosition: `${45 + ((90 - seconds) / 90) * 10}% center` }}
        />
        <div className="absolute inset-x-0 top-40 flex justify-center">
          {s.companion ? (
            <img
              src={portraitSrc(s.companion.species)}
              alt=""
              className="h-24 w-24 animate-pulse object-contain"
            />
          ) : null}
        </div>
        <div className="space-y-2 px-5 py-6">
          <p className="text-xs uppercase tracking-[0.2em] text-mute">{path?.name}</p>
          <h2 className="font-display text-2xl">
            {s.companion?.name ?? "Someone"} is on the path.
          </h2>
          <p className="text-sm text-mute">
            {seconds > 0 ? `${seconds}s · the journey continues if you close the app.` : "Coming home."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <img src={assetSrc("art/path.webp")} alt="" className="h-44 w-full object-cover sm:h-56" />
      <div className="space-y-4 px-4 pb-28 pt-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-mute">Journey</p>
          <h2 className="font-display text-2xl font-semibold">Send them out</h2>
          <p className="text-sm text-mute">
            A journey costs {JOURNEY_FLAMES} Flames and takes about 90 seconds. They bring something home, or meet what lives there.
          </p>
        </div>
        <div className="space-y-2">
          {PATHS.map((path) => (
            <button
              key={path.id}
              type="button"
              disabled={!s.companion || s.fuel < ERRAND_COST}
              onClick={() => s.startWalk(path.id)}
              className="flex min-h-16 w-full items-center justify-between rounded-md border border-ash bg-stone px-4 py-3 text-left disabled:opacity-40"
            >
              <span>
                <span className="block font-medium">{path.name}</span>
                <span className="text-sm text-mute">{path.blurb}</span>
              </span>
              <span className="flex items-center gap-1 text-sm text-fire">
                <Flame className="size-3.5" />
                {JOURNEY_FLAMES}
              </span>
            </button>
          ))}
        </div>
        {s.fuel < ERRAND_COST ? (
          <p className="text-sm text-mute">Tend the fire a little more, then journey.</p>
        ) : null}
      </div>
    </div>
  );
}

function CombatScreen() {
  const s = useKindling();
  const c = s.combat;
  if (!c || !s.companion) return null;
  const enemy = SPECIES[c.enemy];
  const done = Boolean(c.result);

  return (
    <div className="px-4 pb-28 pt-4">
      <p className="text-xs uppercase tracking-[0.2em] text-mute">On the path</p>
      <h2 className="font-display text-2xl font-semibold">{enemy.name}</h2>
      <p className="text-sm text-mute">{enemy.blurb}</p>

      <div className="mt-5 flex items-end justify-between gap-4">
        <Fighter
          name={s.companion.name}
          src={portraitSrc(s.companion.species)}
          hp={c.playerHp}
          max={c.playerMax}
          align="left"
        />
        <Fighter
          name={enemy.name}
          src={portraitSrc(c.enemy)}
          hp={c.enemyHp}
          max={c.enemyMax}
          align="right"
          pose={c.result ? undefined : c.telegraph}
        />
      </div>

      {!done ? (
        <p className="mt-4 text-sm text-mute">
          They telegraph <span className="text-bone">{verbLabel(c.telegraph)}</span>.
        </p>
      ) : (
        <p className="mt-4 text-sm text-bone">
          {c.result === "win" ? "The path opens." : "You walk home. The fire is still there."}
        </p>
      )}

      <ul className="mt-3 space-y-1 text-sm text-mute">
        {c.log.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>

      {done ? (
        <div className="mt-6 space-y-2">
          {c.result === "win" &&
          SPECIES[c.enemy].capturable &&
          s.roster.length < 6 &&
          !s.roster.some((m) => m.species === c.enemy) ? (
            <button
              type="button"
              onClick={() => s.keepEncounter()}
              className="min-h-12 w-full rounded-md bg-fire px-4 font-medium text-night"
            >
              Keep them by the fire
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => s.leaveCombat()}
            className="min-h-12 w-full rounded-md border border-ash bg-stone px-4 font-medium"
          >
            Back to camp
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-2">
          {(["strike", "guard", "skill"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => s.playerAct(v)}
              className="min-h-14 rounded-md border border-ash bg-stone text-sm font-medium uppercase tracking-wide"
            >
              {verbLabel(v)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Fighter({
  name,
  src,
  hp,
  max,
  align,
  pose,
}: {
  name: string;
  src: string;
  hp: number;
  max: number;
  align: "left" | "right";
  pose?: "strike" | "guard" | "skill";
}) {
  return (
    <div className={cn("flex-1", align === "right" && "text-right")}>
      <img
        src={src}
        alt=""
        className={cn(
          "mx-auto h-28 w-28 object-contain transition-transform duration-300",
          pose === "strike" && (align === "right" ? "-translate-x-2 scale-110" : "translate-x-2 scale-110"),
          pose === "guard" && "scale-x-125",
          pose === "skill" && "scale-110",
        )}
      />
      <p className="mt-1 text-sm font-medium">{name}</p>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-ash">
        <div
          className="h-full bg-fire"
          style={{ width: `${Math.max(0, (hp / max) * 100)}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-mute">
        {hp} / {max}
      </p>
    </div>
  );
}

export function CompanionScreen() {
  const s = useKindling();
  const stage = stageOf(s);
  const [name, setName] = useState(s.companion?.name ?? "");
  const warmthNow = eggWarmth(s);
  const ready = eggReady(s);
  const maturePairs = useMemo(
    () => pairings(s.roster).filter((p) => bondUnits(p.a) >= 18 && bondUnits(p.b) >= 18),
    [s.roster],
  );

  useEffect(() => {
    setName(s.companion?.name ?? "");
  }, [s.companion?.id, s.companion?.name]);

  if (s.awaitingHatch) {
    return (
      <div className="space-y-4 px-4 pb-28 pt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-mute">The coals</p>
        <h2 className="font-display text-3xl font-semibold">Something small is waiting.</h2>
        <p className="text-sm text-mute">Choose who rises next. The last one stays in the lineage.</p>
        <div className="grid grid-cols-2 gap-3">
          {s.unlocked.map((id) => {
            const spec = SPECIES[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => s.hatch(id)}
                className="rounded-md border border-ash bg-stone p-3 text-left"
              >
                <img src={portraitSrc(id)} alt="" className="mx-auto h-24 w-24 object-contain" />
                <p className="mt-2 font-medium">{spec.name}</p>
                <p className="text-xs text-mute">{spec.blurb}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!s.companion) {
    return (
      <div className="px-4 py-10 text-mute">
        No one is by the fire. The coals are still warm enough to hatch.
      </div>
    );
  }

  return (
    <div className="px-4 pb-28 pt-4">
      <div className="flex flex-col items-center pt-2">
        <img
          src={portraitSrc(s.companion.species)}
          alt=""
          className="h-40 w-40 object-contain"
        />
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-mute">{SPECIES[s.companion.species].name}</p>
        <h2 className="font-display text-3xl font-semibold">{s.companion.name}</h2>
        <p className="text-sm text-mute">
          {stage.name} · {s.companion.bondXp} Bond XP · {s.encounters.wins} paths held
        </p>
        {s.companion.trait ? (
          <p className="mt-1 text-sm text-fire">Carries {s.companion.trait}</p>
        ) : null}
      </div>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          s.rename(name);
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={22}
          aria-label="Companion name"
          className="min-h-12 flex-1 rounded-md border border-ash bg-night px-3 text-sm text-bone outline-none focus:border-mute"
        />
        <button type="submit" className="min-h-12 rounded-md border border-ash bg-stone px-4 text-sm">
          Name
        </button>
      </form>

      <p className="mt-6 text-sm text-mute">{SPECIES[s.companion.species].blurb}</p>
      <p className="mt-2 text-sm text-mute">
        {SPECIES[s.companion.species].combat.tendency.replace("-", " ")} · born {formatDay(s.companion.born)}
      </p>

      {s.egg ? (
        <section className="mt-8 rounded-md border border-fire/35 bg-coal p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-mute">Ember Egg</p>
          <h3 className="mt-1 font-display text-xl">{SPECIES[s.egg.species].name}</h3>
          <p className="text-sm text-mute">From {s.egg.parentAName} + {s.egg.parentBName}</p>
          <div className="mt-3 flex gap-1.5" aria-label={`${warmthNow} of ${s.egg.required} warmth`}>
            {Array.from({ length: s.egg.required }).map((_, i) => (
              <span key={i} className={cn("h-2 flex-1 rounded-full", i < warmthNow ? "bg-fire" : "bg-ash")} />
            ))}
          </div>
          <p className="mt-2 text-sm text-mute">
            {ready ? "Warm enough to hatch whenever you are ready." : `${warmthNow} / ${s.egg.required} ordinary care actions warmed the egg.`}
          </p>
          {ready ? (
            <button
              type="button"
              onClick={() => s.hatchEgg()}
              className="mt-3 min-h-12 w-full rounded-md bg-fire px-4 font-medium text-night"
            >
              Hatch
            </button>
          ) : null}
        </section>
      ) : null}

      {s.roster.length > 1 ? (
        <div className="mt-8">
          <h3 className="font-display text-xl">By the fire</h3>
          <p className="text-sm text-mute">Who keeps tonight.</p>
          <ul className="mt-3 space-y-2">
            {s.roster.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => s.switchCompanion(m.id)}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-3 rounded-md border px-3 py-2 text-left",
                    m.id === s.companion?.id ? "border-fire/50 bg-coal" : "border-ash bg-stone",
                  )}
                >
                  <img src={portraitSrc(m.species)} alt="" className="h-12 w-12 object-contain" />
                  <span className="flex-1">
                    <span className="block font-medium">{m.name}</span>
                    <span className="text-xs text-mute">
                      {SPECIES[m.species].name} · {stageOfCompanion(m).name} · {m.bondXp} Bond
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!s.egg && maturePairs.length > 0 && s.roster.length < 6 ? (
        <div className="mt-8">
          <h3 className="font-display text-xl">Lineage</h3>
          <p className="text-sm text-mute">Two tender-or-older companions can leave an egg in the coals.</p>
          <ul className="mt-3 space-y-2">
            {maturePairs.map((p) => (
              <li key={p.a.id + p.b.id}>
                <button
                  type="button"
                  onClick={() => s.breed(p.a.id, p.b.id)}
                  className="flex min-h-14 w-full items-center justify-between rounded-md border border-ash bg-stone px-3 py-2 text-left"
                >
                  <span className="text-sm">
                    {p.a.name} · {p.b.name}
                  </span>
                  <span className="text-xs text-fire">Egg · {SPECIES[p.child].name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!s.egg && s.roster.length > 1 && maturePairs.length === 0 ? (
        <p className="mt-8 text-sm text-mute">Pairing opens when two companions have reached tender.</p>
      ) : null}

      <h3 className="mt-8 font-display text-xl">Ancestors</h3>
      {s.lineage.length === 0 ? (
        <p className="mt-2 text-sm text-mute">No ancestors yet. The fire has only been kept.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {s.lineage.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-md border border-ash bg-stone px-3 py-2">
              <img src={portraitSrc(a.species)} alt="" className="h-12 w-12 object-contain grayscale" />
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-mute">
                  Kindled {formatDay(a.kindledOn)} · {a.stage} · {a.bondXp} Bond XP
                  {a.trait ? ` · ${a.trait}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PackScreen() {
  const s = useKindling();
  if (!s.found.length) {
    return (
      <div className="px-5 py-10">
        <h2 className="font-display text-2xl">Pack</h2>
        <p className="mt-2 text-sm text-mute">Journeys leave small things. The pack is empty for now.</p>
      </div>
    );
  }
  return (
    <div className="px-4 pb-28 pt-4">
      <h2 className="font-display text-2xl font-semibold">Pack</h2>
      <p className="text-sm text-mute">{s.found.length} brought home</p>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {s.found.map((item) => (
          <li key={item.id} className="rounded-md border border-ash bg-stone p-3">
            <p className="text-xs uppercase tracking-wide text-mute">{item.kind}</p>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-mute">{formatDay(item.date)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function JournalScreen() {
  const s = useKindling();
  const [line, setLine] = useState("");

  return (
    <div className="px-4 pb-28 pt-4">
      <h2 className="font-display text-2xl font-semibold">Journal</h2>
      <p className="text-sm text-mute">A line is enough. Nothing here is scored.</p>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          s.note(line);
          setLine("");
        }}
      >
        <input
          value={line}
          onChange={(e) => setLine(e.target.value)}
          placeholder="One line from today"
          className="min-h-12 flex-1 rounded-md border border-ash bg-night px-3 text-sm text-bone outline-none placeholder:text-mute/60 focus:border-mute"
        />
        <button type="submit" className="min-h-12 rounded-md bg-fire px-4 text-sm font-medium text-night">
          Keep
        </button>
      </form>
      <ul className="mt-6 space-y-4">
        {s.journal.map((entry) => (
          <li key={entry.date} className="border-b border-ash pb-4">
            <p className="text-xs uppercase tracking-wide text-mute">{formatDay(entry.date)}</p>
            <p className="text-sm text-mute">
              {entry.kept} tended
              {entry.mood ? ` · ${entry.mood}` : ""}
            </p>
            {entry.lines.map((l, i) => (
              <p key={i} className="mt-1 text-sm">
                {l}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function KindlingEvent() {
  const s = useKindling();
  if (!s.kindlingPending || !s.companion) return null;
  const missed = consecutiveMissed(s);
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-night/92 px-6 text-center">
      <div className="max-w-sm space-y-5">
        <p className="text-xs uppercase tracking-[0.28em] text-mute">The fire was not tended.</p>
        <h2 className="font-display text-4xl font-semibold leading-tight">
          {s.companion.name} became Kindling.
        </h2>
        <p className="text-sm text-mute">
          {missed} quiet days in a row. They stay in the lineage. The coals can still hatch another.
        </p>
        <button
          type="button"
          onClick={() => s.confirmKindling()}
          className="min-h-12 w-full rounded-md bg-fire px-4 font-medium text-night"
        >
          Keep their name
        </button>
      </div>
    </div>
  );
}

export function BreatheModal() {
  const s = useKindling();
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "done">("in");
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!s.breatheOpen) return;
    setPhase("in");
    setRound(0);
    let current: "in" | "hold" | "out" = "in";
    let completed = 0;
    let timer = 0;
    let cancelled = false;

    const duration = { in: 4000, hold: 4000, out: 6000 } as const;
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (cancelled) return;
        if (current === "in") {
          current = "hold";
          setPhase("hold");
        } else if (current === "hold") {
          current = "out";
          setPhase("out");
        } else {
          completed += 1;
          useKindling.getState().countBreath();
          setRound(completed);
          if (completed >= 4) {
            setPhase("done");
            return;
          }
          current = "in";
          setPhase("in");
        }
        schedule();
      }, duration[current]);
    };

    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [s.breatheOpen]);

  if (!s.breatheOpen) return null;

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-night/90 px-6">
      <button
        type="button"
        onClick={() => s.setBreatheOpen(false)}
        className="absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-ash"
        aria-label="Close"
      >
        <X className="size-5" />
      </button>
      <div className="flex flex-col items-center gap-6">
        <div
          className={cn(
            "size-40 rounded-full border-2 border-fire/80 bg-coal/40 transition-transform ease-in-out",
            phase === "in" && "scale-110 duration-[4000ms]",
            phase === "hold" && "scale-110 duration-[4000ms]",
            phase === "out" && "scale-75 duration-[6000ms]",
            phase === "done" && "scale-90 duration-500",
          )}
        />
        <p className="font-display text-3xl capitalize">
          {phase === "in" ? "In" : phase === "hold" ? "Hold" : phase === "out" ? "Out" : "Done"}
        </p>
        <p className="text-sm text-mute">4 in · 4 hold · 6 out · four rounds.</p>
        <p className="text-xs text-mute">{round} / 4 completed</p>
        {phase === "done" ? (
          <button
            type="button"
            onClick={() => s.setBreatheOpen(false)}
            className="min-h-12 rounded-md bg-fire px-6 font-medium text-night"
          >
            Back to the fire
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function GoalEditor() {
  const s = useKindling();
  const [text, setText] = useState("");
  if (!s.editingGoals) return null;

  const groups = ["body", "hygiene", "mind", "connection", "daily"] as const;

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-night px-4 pb-10 pt-6">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">The list</h2>
          <button
            type="button"
            onClick={() => s.setEditingGoals(false)}
            className="grid size-11 place-items-center rounded-full border border-ash"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-mute">Five still fills the fire, however long the list.</p>

        <ul className="mt-4 space-y-2">
          {s.tasks.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-md border border-ash bg-stone px-3 py-2">
              <span>
                {t.text}
                {t.progressive ? <span className="ml-2 text-xs text-fire">optional tiers</span> : null}
              </span>
              <button type="button" onClick={() => s.removeTask(t.id)} className="text-sm text-mute">
                Remove
              </button>
            </li>
          ))}
        </ul>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            s.addTask(text);
            setText("");
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="A thing you already do"
            className="min-h-12 flex-1 rounded-md border border-ash bg-night px-3 text-sm outline-none focus:border-mute"
          />
          <button type="submit" className="grid size-12 place-items-center rounded-md bg-fire text-night">
            <Plus className="size-5" />
          </button>
        </form>

        {groups.map((g) => (
          <div key={g} className="mt-5">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-mute">{g}</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_TASKS.filter((p) => p.category === g).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => s.addPreset(p.text, p.category, p.progressive)}
                  className="rounded-full border border-ash bg-stone px-3 py-2 text-sm"
                >
                  {p.text}{p.progressive ? " +" : ""}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FirstNote() {
  const s = useKindling();
  if (s.seen) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-night/90 px-6">
      <div className="max-w-sm space-y-4 rounded-lg border border-ash bg-stone p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-mute">Kindling</p>
        <h2 className="font-display text-3xl font-semibold leading-tight">Five small things. A fire. A monster who stays if you do.</h2>
        <p className="text-sm text-mute">
          Five care points tend the fire. {JOURNEY_FLAMES} Flames opens a journey. Two fully missed care-days and your active monster becomes Kindling — their name stays in the lineage and the coals can begin again.
        </p>
        <button
          type="button"
          onClick={() => s.markSeen()}
          className="min-h-12 w-full rounded-md bg-fire font-medium text-night"
        >
          Tend the fire
        </button>
      </div>
    </div>
  );
}

export type { Mood, SpeciesId };

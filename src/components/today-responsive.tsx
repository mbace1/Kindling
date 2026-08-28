import { useState } from "react";
import { Check, ChevronDown, Flame, Wind } from "lucide-react";
import { CampCanvas } from "@/components/camp-canvas";
import { UiAtlasSprite } from "@/components/ui-atlas-sprite";
import {
  ERRAND_COST,
  FLAMES_PER_FUEL,
  FULL_DAY,
  MOODS,
  caredToday,
  flames,
  nextStageBondXp,
  progressiveOpportunities,
  stageOf,
  warningState,
} from "@/lib/kindling/model";
import { useKindling } from "@/lib/kindling/store";
import { cn } from "@/lib/utils";

const JOURNEY_FLAMES = ERRAND_COST * FLAMES_PER_FUEL;

export function TodayResponsive() {
  const s = useKindling();
  const [moreOpen, setMoreOpen] = useState(false);
  const cared = caredToday(s);
  const fireDone = Math.min(FULL_DAY, cared);
  const warn = warningState(s);
  const stage = stageOf(s);
  const nextBond = nextStageBondXp(s);
  const progressive = progressiveOpportunities(s);

  return (
    <div>
      <CampCanvas save={s} />

      <div className="space-y-4 px-4 pb-28 pt-4 sm:space-y-5">
        <section className="rounded-lg border border-ash/80 bg-stone/70 p-4 sm:border-0 sm:bg-transparent sm:p-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-mute">
                {warn ? "The fire is fading." : fireDone >= FULL_DAY ? "Fire tended. Enough for today." : "Today"}
              </p>
              <h2 className="font-display text-2xl font-semibold">{fireDone} / {FULL_DAY} tended</h2>
              <p className="mt-0.5 text-sm text-mute sm:hidden">
                {s.companion ? `${s.companion.name} · ${stage.name}` : "Keep the coals going."}
              </p>
              <p className="mt-0.5 hidden text-sm text-mute sm:block">
                {s.tasks.length} on your list{s.companion ? ` · ${s.companion.name} is ${stage.name}` : ""}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="flex items-center justify-end gap-1 text-fire">
                <Flame className="size-4" />
                <span className="font-medium">{flames(s)}</span>
              </p>
              <p className="text-[11px] text-mute">Flames</p>
              {warn ? (
                <UiAtlasSprite
                  x={640}
                  y={1148}
                  width={113}
                  height={69}
                  displayWidth={76}
                  className="ml-auto mt-2 rounded-md"
                />
              ) : null}
              {s.companion ? (
                <p className="mt-1 hidden text-xs text-mute sm:block">
                  {s.companion.bondXp} Bond XP{nextBond ? ` · ${nextBond} to next form` : ""}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-1" aria-label={`${fireDone} of ${FULL_DAY} fire steps tended`}>
            {Array.from({ length: FULL_DAY }).map((_, i) => (
              <UiAtlasSprite
                key={i}
                x={656}
                y={fireDone > i ? 124 : 50}
                width={65}
                height={63}
                displayWidth={58}
                className="rounded-full"
              />
            ))}
          </div>

          {fireDone >= FULL_DAY ? (
            <p className="mt-3 text-sm text-mute">The fire stays full. Anything else today is optional.</p>
          ) : null}
        </section>

        {!s.walkedOnce && s.fuel >= ERRAND_COST && s.companion ? (
          <button
            type="button"
            onClick={() => s.setTab("journey")}
            className="w-full rounded-lg border border-fire/40 bg-coal px-4 py-3 text-left"
          >
            <p className="font-medium text-fire">The path is open.</p>
            <p className="text-sm text-mute">{JOURNEY_FLAMES} Flames sends them out for a while.</p>
          </button>
        ) : null}

        <section className="space-y-2">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-mute">Care</p>
              <p className="text-sm text-mute sm:hidden">Choose what fits today.</p>
            </div>
            <button
              type="button"
              onClick={() => s.setEditingGoals(true)}
              className="min-h-10 rounded-md border border-ash bg-stone px-3 text-xs text-mute"
            >
              Edit
            </button>
          </div>

          {s.tasks.map((task) => {
            const on = s.sheet.done.includes(task.id);
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => s.toggleTask(task.id)}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition",
                  on ? "border-fire/40 bg-coal/60 text-bone" : "border-ash bg-stone text-bone hover:border-mute",
                )}
              >
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border", on ? "border-fire bg-fire text-night" : "border-mute/50")}> 
                  {on ? <Check className="size-4" /> : null}
                </span>
                <span className="flex-1 text-base font-medium">{task.text}</span>
                {!s.sheet.paid.includes(task.id) && !on ? <span className="text-xs text-mute">+20</span> : null}
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
                className="flex min-h-16 w-full items-center justify-between gap-4 rounded-lg border border-fire/35 bg-coal px-4 py-3 text-left"
              >
                <span>
                  <span className="block font-medium">{tier.label}</span>
                  <span className="text-xs text-mute">Only if you want to.</span>
                </span>
                <span className="shrink-0 text-right text-xs text-fire">+{tier.flames}<br />+{tier.bondXp} Bond</span>
              </button>
            ))}
          </section>
        ) : null}

        <section className="sm:hidden">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className="flex min-h-12 w-full items-center justify-between rounded-lg border border-ash bg-stone px-4 text-left"
          >
            <span>
              <span className="block text-sm font-medium">More care</span>
              <span className="block text-xs text-mute">Breathe · mood · Bond details</span>
            </span>
            <ChevronDown className={cn("size-4 text-mute transition-transform", moreOpen && "rotate-180")} />
          </button>

          {moreOpen ? (
            <div className="mt-2 space-y-4 rounded-lg border border-ash bg-stone/70 p-3">
              <button
                type="button"
                onClick={() => s.setBreatheOpen(true)}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-ash bg-coal px-3 text-sm text-bone"
              >
                <Wind className="size-4 text-mute" /> Breathe
              </button>

              {s.companion ? (
                <p className="text-xs text-mute">
                  {s.companion.bondXp} Bond XP{nextBond ? ` · ${nextBond} to next form` : ""}
                </p>
              ) : null}

              <MoodRow />
            </div>
          ) : null}
        </section>

        <section className="hidden space-y-4 sm:block">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => s.setEditingGoals(true)}
              className="min-h-12 flex-1 rounded-md border border-ash bg-stone px-3 text-sm text-mute"
            >Edit the list</button>
            <button
              type="button"
              onClick={() => s.setBreatheOpen(true)}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md border border-ash bg-stone px-3 text-sm text-bone"
            >
              <Wind className="size-4 text-mute" /> Breathe
            </button>
          </div>
          <MoodRow />
        </section>
      </div>
    </div>
  );
}

function MoodRow() {
  const s = useKindling();
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-mute">How is it</p>
      <div className="grid grid-cols-5 gap-1.5">
        {MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => s.setMood(m.id)}
            className={cn(
              "min-h-12 rounded-md border text-xs font-medium",
              s.sheet.mood === m.id ? "border-fire bg-coal text-bone" : "border-ash bg-stone text-mute",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

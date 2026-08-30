import { FULL_DAY, caredToday, warningState, warmth, type KindlingSave } from "@/lib/kindling/model";
import { cn } from "@/lib/utils";

type Props = {
  save: KindlingSave;
};

export function CampReactionCue({ save }: Props) {
  if (!save.companion || save.walk || save.combat) return null;

  const who = save.companion.name;
  const heat = warmth(save);
  const warned = Boolean(warningState(save) || save.kindlingPending);
  const full = caredToday(save) >= FULL_DAY;
  const latest = save.found[0];
  const hasMossBed = save.found.some((item) => item.kind === "moss");

  let glyph = "·";
  let label = `${who} watches the fire.`;
  let motion = "animate-pulse";

  if (warned || heat <= 0.2) {
    glyph = "…";
    label = `${who} curls close to the weak coals.`;
    motion = "animate-[pulse_1800ms_ease-in-out_infinite]";
  } else if (full || heat >= 0.8) {
    glyph = "✦";
    label = `${who} brightens with the fire.`;
    motion = "animate-bounce";
  } else if (latest?.kind === "memory") {
    glyph = "♡";
    label = `${who} stays close to ${latest.name}.`;
    motion = "animate-[pulse_1300ms_ease-in-out_infinite]";
  } else if (latest?.kind === "shard" || latest?.kind === "relic") {
    glyph = "?";
    label = `${who} keeps inspecting ${latest.name}.`;
    motion = "animate-[bounce_1500ms_ease-in-out_infinite]";
  } else if (hasMossBed) {
    glyph = "z";
    label = `${who} settles into the moss beside the fire.`;
    motion = "animate-[pulse_2200ms_ease-in-out_infinite]";
  }

  return (
    <div
      data-companion-reaction={label}
      aria-label={label}
      className="pointer-events-none absolute bottom-[22%] left-[22%] z-10"
    >
      <span
        aria-hidden="true"
        className={cn(
          "block min-w-7 rounded-full border border-fire/20 bg-night/70 px-2 py-1 text-center font-display text-sm text-fire shadow-[0_3px_10px_rgba(0,0,0,0.35)]",
          motion,
        )}
      >
        {glyph}
      </span>
    </div>
  );
}

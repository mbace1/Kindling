import { Hammer } from "lucide-react";
import { availableCampBuilds, campBuildJournalLine, CAMP_BUILDS } from "@/lib/kindling/camp-construction";
import { FLAMES_PER_FUEL, journalEntry, type FindKind } from "@/lib/kindling/model";
import { useKindling } from "@/lib/kindling/store";
import { cn } from "@/lib/utils";

export function CampConstructionPanel() {
  const s = useKindling();
  const builds = availableCampBuilds(s);
  const builtCount = builds.filter((build) => build.built).length;

  function buildCamp(kind: FindKind) {
    const current = useKindling.getState();
    const next = current.snapshot();
    const build = CAMP_BUILDS[kind];
    const state = availableCampBuilds(next).find((entry) => entry.kind === kind);
    if (!state?.canBuild) return;

    let remaining = build.materialCount;
    next.found = next.found.filter((item) => {
      if (item.kind === kind && remaining > 0) {
        remaining -= 1;
        return false;
      }
      return true;
    });
    next.fuel = Math.max(0, next.fuel - build.flameCost / FLAMES_PER_FUEL);
    journalEntry(next).lines.push(campBuildJournalLine(kind));
    next.updatedAt = Date.now();

    current.hydrate(next);
    useKindling.setState({ lastToast: `${build.name} built.` });
  }

  return (
    <section className="rounded-lg border border-fire/25 bg-coal/45 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-fire">
            <Hammer className="size-3.5" /> Camp
          </p>
          <p className="mt-0.5 text-sm text-mute">Bring finds home, then decide what the fire becomes.</p>
        </div>
        <span className="shrink-0 text-xs text-mute">{builtCount} / {builds.length}</span>
      </div>

      <div className="mt-3 space-y-2">
        {builds.map((build) => (
          <div
            key={build.kind}
            className={cn(
              "rounded-md border px-3 py-3",
              build.built ? "border-fire/30 bg-night/45" : "border-ash/80 bg-night/25",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-bone">{build.name}</p>
                <p className="mt-0.5 text-xs text-mute">{build.effect}</p>
              </div>
              {build.built ? <span className="shrink-0 text-xs text-fire">BUILT</span> : null}
            </div>

            {!build.built ? (
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-mute">
                  {build.materials} / {build.materialCount} {build.kind} · {build.flameCost} Flames
                </p>
                <button
                  type="button"
                  disabled={!build.canBuild}
                  onClick={() => buildCamp(build.kind)}
                  className={cn(
                    "min-h-9 rounded-md border px-3 text-xs font-medium",
                    build.canBuild
                      ? "border-fire/50 bg-fire text-night"
                      : "border-ash bg-stone text-mute opacity-60",
                  )}
                >
                  Build
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

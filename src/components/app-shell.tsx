import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Flame, Footprints, Volume2, VolumeX } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { authEnabled, signOut } from "@/lib/auth/client";
import { loadCloudSave, writeCloudSave } from "@/lib/kindling/saves";
import { useKindling } from "@/lib/kindling/store";
import { startFireLoop, stopFireLoop, unlockAudio } from "@/lib/kindling/audio";
import { assetSrc, dayKey, type Tab } from "@/lib/kindling/model";
import { WORLD_PATHS } from "@/lib/kindling/world";
import { cn } from "@/lib/utils";
import { CompanionScreen } from "@/components/companion-screen";
import { GameplayFindEffects } from "@/components/gameplay-find-effects";
import { JourneyWorldScreen } from "@/components/journey-world-screen";
import { PackResponsive } from "@/components/pack-responsive";
import { TodayResponsive } from "@/components/today-responsive";
import { UiAtlasSprite } from "@/components/ui-atlas-sprite";
import {
  BreatheModal,
  FirstNote,
  GoalEditor,
  JournalScreen,
  KindlingEvent,
} from "@/components/screens";

const HUB_STATIC = import.meta.env.VITE_HUB_STATIC === "true";

const NAV: { id: Tab; label: string; sprite: { x: number; y: number; w: number; h: number } }[] = [
  { id: "today", label: "Today", sprite: { x: 779, y: 1190, w: 26, h: 39 } },
  { id: "journey", label: "Walk", sprite: { x: 835, y: 1191, w: 38, h: 34 } },
  { id: "companion", label: "Keep", sprite: { x: 1040, y: 1188, w: 40, h: 37 } },
  { id: "pack", label: "Pack", sprite: { x: 902, y: 1187, w: 37, h: 39 } },
  { id: "journal", label: "Book", sprite: { x: 975, y: 1188, w: 34, h: 35 } },
];

const hubStatic = import.meta.env.VITE_HUB_STATIC === "true";

export function AppShell() {
  const s = useKindling();
  const { user, isPending } = useCurrentUserState();

  useEffect(() => {
    useKindling.getState().hydrate();
  }, []);

  useEffect(() => {
    if (!s.hydrated || s.lastKept || !s.companion) return;
    if (s.companion.born === dayKey()) return;
    const anchored = useKindling.getState().snapshot();
    if (!anchored.companion) return;
    anchored.lastKept = anchored.companion.born;
    anchored.updatedAt = Date.now();
    useKindling.getState().hydrate(anchored);
  }, [s.hydrated, s.lastKept, s.companion?.id, s.companion?.born]);

  useEffect(() => {
    if (!s.hydrated || !s.walk || s.walk.endsAt > Date.now()) return;
    useKindling.getState().finishWalk();
  }, [s.hydrated, s.walk?.startedAt, s.walk?.endsAt]);

  useEffect(() => {
    if (HUB_STATIC || !s.hydrated || isPending || !user) return;
    let cancelled = false;
    void (async () => {
      try {
        const cloud = await loadCloudSave();
        if (cancelled) return;
        const local = useKindling.getState().snapshot();
        if (cloud && cloud.updatedAt > local.updatedAt) {
          useKindling.getState().hydrate(cloud);
        } else {
          await writeCloudSave({ data: local });
        }
      } catch {
        /* guest-quality local save still stands */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [s.hydrated, isPending, user]);

  useEffect(() => {
    if (HUB_STATIC || !s.hydrated || !user) return;
    const t = window.setTimeout(() => {
      void writeCloudSave({ data: useKindling.getState().snapshot() }).catch(() => undefined);
    }, 800);
    return () => window.clearTimeout(t);
  }, [s.updatedAt, s.hydrated, user]);

  useEffect(() => {
    if (!s.hydrated) return;
    if (s.sound && s.tab === "today") {
      unlockAudio();
      startFireLoop();
    } else {
      stopFireLoop();
    }
    return () => stopFireLoop();
  }, [s.sound, s.tab, s.hydrated]);

  const Screen =
    s.tab === "journey"
      ? JourneyWorldScreen
      : s.tab === "companion"
        ? CompanionScreen
        : s.tab === "pack"
          ? PackResponsive
          : s.tab === "journal"
            ? JournalScreen
            : TodayResponsive;

  const combatPath = s.combat ? WORLD_PATHS.find((path) => path.id === s.combat?.pathId) : null;
  const combatBackdrop = Boolean(s.hydrated && s.tab === "journey" && s.combat);

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col overflow-x-hidden bg-night text-bone shadow-[0_0_80px_rgba(0,0,0,0.35)] before:pointer-events-none before:absolute before:inset-0 before:z-0 before:bg-[radial-gradient(circle_at_50%_-10%,rgba(255,181,78,0.07),transparent_32%),linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.12)_100%)]">
      <GameplayFindEffects />
      <header
        className={cn(
          "relative z-10 flex items-center justify-between border-b border-bone/10 bg-night/82 px-4 pb-3 shadow-[0_8px_28px_rgba(0,0,0,0.15)] backdrop-blur-md",
          hubStatic ? "pt-16" : "pt-4",
        )}
      >
        <div>
          <p className="font-display text-xl font-semibold leading-none tracking-wide">Kindling</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-mute">The day turns at 04:00</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => s.setSound(!s.sound)}
            className="grid size-9 place-items-center rounded-full border border-bone/15 bg-coal/70 text-mute shadow-inner transition hover:border-fire/35 hover:text-fire"
            aria-label={s.sound ? "Mute the fire" : "Hear the fire"}
          >
            {s.sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
          <AuthSlot />
        </div>
      </header>

      {s.hydrated && s.walk ? (
        <button
          type="button"
          onClick={() => s.setTab("journey")}
          className="relative z-10 mx-4 mb-2 mt-2 flex min-h-11 items-center gap-2 rounded-lg border border-fire/35 bg-gradient-to-r from-coal to-stone px-3 text-left text-sm shadow-lg"
        >
          <Footprints className="size-4 shrink-0 text-fire" />
          <span className="flex-1">
            <span className="font-medium text-bone">{s.companion?.name ?? "Your companion"} is on the path.</span>
            <span className="ml-2 text-mute">View journey</span>
          </span>
        </button>
      ) : null}

      {s.hydrated && s.combat && !s.combat.result ? (
        <button
          type="button"
          onClick={() => s.leaveCombat()}
          className="relative z-10 mx-4 mb-2 mt-2 min-h-11 rounded-lg border border-ash bg-stone/90 px-3 text-left text-sm text-mute shadow-lg"
        >
          Retreat from the encounter · nothing else is lost
        </button>
      ) : null}

      <main
        className={cn("relative z-10 flex-1", combatBackdrop && "bg-cover bg-center bg-no-repeat")}
        style={
          combatBackdrop
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(8,10,15,0.34), rgba(8,10,15,0.94)), url("${assetSrc(combatPath?.art ?? "art/path.webp")}")`,
              }
            : undefined
        }
      >
        {s.hydrated ? <Screen /> : <div className="h-[52vh] animate-pulse bg-stone" />}
      </main>

      {s.lastToast ? (
        <p className="pointer-events-none fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-fire/25 bg-night/94 px-3 py-2 text-center text-sm text-fire shadow-2xl backdrop-blur-md">
          {s.lastToast}
        </p>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-lg border-t border-bone/10 bg-gradient-to-b from-stone/95 to-night/98 px-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-10px_32px_rgba(0,0,0,0.25)] backdrop-blur-md">
        {NAV.map((item) => {
          const on = s.tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => s.setTab(item.id)}
              className={cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 border-t text-[11px] transition",
                on ? "border-fire/70 bg-fire/5 text-fire" : "border-transparent text-mute",
              )}
            >
              <UiAtlasSprite
                x={item.sprite.x}
                y={item.sprite.y}
                width={item.sprite.w}
                height={item.sprite.h}
                displayWidth={24}
                className={cn("transition-all", on ? "scale-105 opacity-100" : "opacity-50")}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      {s.hydrated ? (
        <>
          <FirstNote />
          <KindlingEvent />
          <BreatheModal />
          <GoalEditor />
        </>
      ) : null}
    </div>
  );
}

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (HUB_STATIC) return <Flame className="size-4 text-fire" aria-label="Local save" />;
  if (isPending) return <div className="h-9 w-20 animate-pulse rounded-full bg-ash" />;
  if (!user) {
    return (
      <Link to="/login" className="flex min-h-9 items-center rounded-full border border-ash px-3 text-xs text-mute">
        Sign in
      </Link>
    );
  }
  const label = user.displayName ?? user.primaryEmail ?? "You";
  return (
    <div className="flex items-center gap-2">
      {user.profileImageUrl ? (
        <img src={user.profileImageUrl} alt="" className="size-8 rounded-full object-cover" />
      ) : (
        <span className="grid size-8 place-items-center rounded-full bg-ash text-xs">{label.charAt(0)}</span>
      )}
      {authEnabled ? (
        <button type="button" onClick={() => void signOut()} className="text-xs text-mute underline-offset-4 hover:underline">Sign out</button>
      ) : (
        <Flame className="size-4 text-fire" />
      )}
    </div>
  );
}

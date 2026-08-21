import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Flame, Footprints, Home, Package, UserRound, Volume2, VolumeX } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { authEnabled, signOut } from "@/lib/auth/client";
import { loadCloudSave, writeCloudSave } from "@/lib/kindling/saves";
import { useKindling } from "@/lib/kindling/store";
import { startFireLoop, stopFireLoop, unlockAudio } from "@/lib/kindling/audio";
import { assetSrc, dayKey, type Tab } from "@/lib/kindling/model";
import { WORLD_PATHS } from "@/lib/kindling/world";
import { cn } from "@/lib/utils";
import { CompanionResponsive } from "@/components/companion-responsive";
import { JourneyWorldScreen } from "@/components/journey-world-screen";
import { TodayResponsive } from "@/components/today-responsive";
import {
  BreatheModal,
  FirstNote,
  GoalEditor,
  JournalScreen,
  KindlingEvent,
  PackScreen,
} from "@/components/screens";

const HUB_STATIC = import.meta.env.VITE_HUB_STATIC === "true";

const NAV: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "today", label: "Today", icon: Home },
  { id: "journey", label: "Walk", icon: Footprints },
  { id: "companion", label: "Keep", icon: UserRound },
  { id: "pack", label: "Pack", icon: Package },
  { id: "journal", label: "Book", icon: BookOpen },
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
        ? CompanionResponsive
        : s.tab === "pack"
          ? PackScreen
          : s.tab === "journal"
            ? JournalScreen
            : TodayResponsive;

  const combatPath = s.combat ? WORLD_PATHS.find((path) => path.id === s.combat?.pathId) : null;
  const combatBackdrop = Boolean(s.hydrated && s.tab === "journey" && s.combat);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-night text-bone">
      {/* On the arcade the site's own HUB button is fixed to the top-left
          corner, where it lands on the title. The header drops below it there
          — both ends of the row move together, so it reads as intended
          spacing rather than a dodge. */}
      <header
        className={cn(
          "flex items-center justify-between px-4 pb-2",
          hubStatic ? "pt-16" : "pt-4",
        )}
      >
        <div>
          <p className="font-display text-xl font-semibold leading-none">Kindling</p>
          <p className="mt-1 text-xs text-mute">The day turns at 04:00</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => s.setSound(!s.sound)}
            className="grid size-9 place-items-center rounded-full border border-ash text-mute"
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
          className="mx-4 mb-2 flex min-h-11 items-center gap-2 rounded-md border border-fire/35 bg-coal px-3 text-left text-sm"
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
          className="mx-4 mb-2 min-h-11 rounded-md border border-ash bg-stone px-3 text-left text-sm text-mute"
        >
          Retreat from the encounter · nothing else is lost
        </button>
      ) : null}

      <main
        className={cn("flex-1", combatBackdrop && "bg-cover bg-center bg-no-repeat")}
        style={
          combatBackdrop
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(8,10,15,0.42), rgba(8,10,15,0.92)), url("${assetSrc(combatPath?.art ?? "art/path.jpg")}")`,
              }
            : undefined
        }
      >
        {s.hydrated ? <Screen /> : <div className="h-[52vh] animate-pulse bg-stone" />}
      </main>

      {s.lastToast ? (
        <p className="pointer-events-none fixed bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full bg-coal px-3 py-1.5 text-sm text-fire">
          {s.lastToast}
        </p>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-lg border-t border-ash bg-stone/95 px-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur">
        {NAV.map((item) => {
          const Icon = item.icon;
          const on = s.tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => s.setTab(item.id)}
              className={cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
                on ? "text-fire" : "text-mute",
              )}
            >
              <Icon className="size-5" />
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
  if (isPending) {
    return <div className="h-9 w-20 animate-pulse rounded-full bg-ash" />;
  }
  if (!user) {
    return (
      <Link
        to="/login"
        className="flex min-h-9 items-center rounded-full border border-ash px-3 text-xs text-mute"
      >
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
        <button type="button" onClick={() => void signOut()} className="text-xs text-mute underline-offset-4 hover:underline">
          Sign out
        </button>
      ) : (
        <Flame className="size-4 text-fire" />
      )}
    </div>
  );
}

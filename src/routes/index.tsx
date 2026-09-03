import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { GameFeelLayer } from "@/components/game-feel-layer";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <>
      <AppShell />
      <GameFeelLayer />
    </>
  );
}

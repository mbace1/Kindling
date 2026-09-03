import { createFileRoute } from "@tanstack/react-router";
import { SpriteInspector } from "@/components/sprite-inspector";

export const Route = createFileRoute("/dev/sprites")({ component: SpriteInspector });

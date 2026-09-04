import type { KindlingSave } from "./model";

export type CampKeepsake = {
  id: string;
  label: string;
  x: number;
  y: number;
  shape: "stone" | "sprig" | "charm" | "shard";
};

// Keep discoveries close enough to read as things deliberately placed at camp,
// rather than UI symbols floating across the foreground.
const SLOTS = [
  { x: 0.57, y: 0.815 },
  { x: 0.66, y: 0.835 },
  { x: 0.73, y: 0.805 },
  { x: 0.80, y: 0.835 },
] as const;

function shapeFor(kind: string): CampKeepsake["shape"] {
  const k = kind.toLowerCase();
  if (k.includes("plant") || k.includes("herb") || k.includes("moss") || k.includes("leaf")) return "sprig";
  if (k.includes("metal") || k.includes("charm") || k.includes("token") || k.includes("memory")) return "charm";
  if (k.includes("glass") || k.includes("crystal") || k.includes("shard") || k.includes("ice")) return "shard";
  return "stone";
}

export function campKeepsakes(save: Pick<KindlingSave, "found">): CampKeepsake[] {
  return save.found.slice(0, SLOTS.length).map((item, index) => ({
    id: item.id,
    label: item.name,
    x: SLOTS[index].x,
    y: SLOTS[index].y,
    shape: shapeFor(item.kind),
  }));
}

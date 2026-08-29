import type { KindlingSave } from "./model";

export type CampKeepsake = {
  id: string;
  label: string;
  x: number;
  y: number;
  shape: "stone" | "sprig" | "charm" | "shard";
};

const SLOTS = [
  { x: 0.61, y: 0.77 },
  { x: 0.69, y: 0.81 },
  { x: 0.76, y: 0.75 },
  { x: 0.84, y: 0.80 },
] as const;

function shapeFor(kind: string): CampKeepsake["shape"] {
  const k = kind.toLowerCase();
  if (k.includes("plant") || k.includes("herb") || k.includes("moss") || k.includes("leaf")) return "sprig";
  if (k.includes("metal") || k.includes("charm") || k.includes("token")) return "charm";
  if (k.includes("glass") || k.includes("crystal") || k.includes("shard")) return "shard";
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

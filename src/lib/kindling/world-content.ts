import type { FindKind, SpeciesId } from "./model";

export type JourneyChoiceContent = {
  eyebrow: string;
  title: string;
  copy: string;
  investigate: { label: string; toast: string; findKind: FindKind; timeMs: number };
  rest: { label: string; toast: string; bondXp: number; timeMs: number };
  shortcut: { label: string; toast: string; timeMs: number; ambushChance: number };
};

export type RegionContent = {
  id: "ruin" | "forest" | "road" | "ash";
  chapter: number;
  displayName: string;
  worldBlurb: string;
  unlockAfter: string | null;
  artDirection: string;
  art: string;
  crop: string;
  ambience: string;
  enemyPool: SpeciesId[];
  journey: JourneyChoiceContent;
};

export const REGION_CONTENT: RegionContent[] = [
  {
    id: "ruin", chapter: 1, displayName: "Birch Ruins", unlockAfter: null,
    worldBlurb: "White trunks, broken arches, and the first road away from the fire.",
    artDirection: "cool birch woodland, broken pale stone, open daylight path", art: "art/birch-ruins-clean.svg", crop: "50% 55%", ambience: "wind through birch and loose stone", enemyPool: ["mossling"],
    journey: {
      eyebrow: "Birch Ruins · broken arch", title: "A pale glint sits beneath a fallen stone.", copy: "The direct path is open, but the ruin is full of small hiding places.",
      investigate: { label: "Lift the stone", toast: "Something was hidden under the stone.", findKind: "relic", timeMs: 15000 },
      rest: { label: "Sit beneath the arch", toast: "The old stones make a quiet shelter.", bondXp: 20, timeMs: 8000 },
      shortcut: { label: "Cross the collapsed wall", toast: "The broken wall saves time.", timeMs: -20000, ambushChance: 0 },
    },
  },
  {
    id: "forest", chapter: 2, displayName: "Drowned Courtyard", unlockAfter: "ruin",
    worldBlurb: "Roots have split the old court. Water sits where people once did.",
    artDirection: "wet courtyard, roots and moss, shallow water, overgrown masonry", art: "art/drowned-courtyard-clean.svg", crop: "50% center", ambience: "water drip, roots shifting, distant frogs", enemyPool: ["mossling"],
    journey: {
      eyebrow: "Drowned Courtyard · root pool", title: "Something moves under the black water.", copy: "Roots knot around the safer trail. The flooded middle is faster.",
      investigate: { label: "Search the roots", toast: "The roots were holding something soft.", findKind: "moss", timeMs: 20000 },
      rest: { label: "Wait by the dry roots", toast: "You wait together until the water stills.", bondXp: 30, timeMs: 12000 },
      shortcut: { label: "Wade through", toast: "The flooded middle is cold, but quick.", timeMs: -25000, ambushChance: .35 },
    },
  },
  {
    id: "road", chapter: 3, displayName: "Bell Keep", unlockAfter: "forest",
    worldBlurb: "A road of old banners climbs toward a bell that no one rings.",
    artDirection: "ruined keep approach, hanging banners, tower silhouette, windy high path", art: "art/bell-keep-clean.svg", crop: "50% center", ambience: "banner snap, high wind, distant metal", enemyPool: ["mossknight"],
    journey: {
      eyebrow: "Bell Keep · hanging banners", title: "A torn banner marks a narrow side stair.", copy: "The main road is exposed. The stair disappears behind the old wall.",
      investigate: { label: "Follow the banner thread", toast: "The banner leads to something remembered.", findKind: "memory", timeMs: 18000 },
      rest: { label: "Listen at the wall", toast: "For a moment, even the keep is quiet.", bondXp: 20, timeMs: 5000 },
      shortcut: { label: "Take the side stair", toast: "The hidden stair cuts across the keep.", timeMs: -30000, ambushChance: .45 },
    },
  },
  {
    id: "ash", chapter: 4, displayName: "Ashwood", unlockAfter: "road",
    worldBlurb: "Black trees, pale ground, and warmth trapped under the dust.",
    artDirection: "burnt woodland, ash ground, ember traces, open dead-tree path", art: "art/ashwood-clean.svg", crop: "50% center", ambience: "soft ashfall, ember crackle, dead branches", enemyPool: ["ashling"],
    journey: {
      eyebrow: "Ashwood · warm fissure", title: "Heat breathes through a crack in the ground.", copy: "The ash is thin here. Something below is still warm.",
      investigate: { label: "Dig into the warm ash", toast: "There is still something warm beneath the ash.", findKind: "ash", timeMs: 25000 },
      rest: { label: "Warm yourselves here", toast: "You stay beside the buried heat a little longer.", bondXp: 40, timeMs: 15000 },
      shortcut: { label: "Run the cooling ridge", toast: "The ridge holds long enough to cross.", timeMs: -20000, ambushChance: .30 },
    },
  },
];

export const FALLBACK_JOURNEY: JourneyChoiceContent = {
  eyebrow: "A fork in the road",
  title: "Something changes the journey.",
  copy: "Choose once. The road remembers.",
  investigate: { label: "Investigate", toast: "A closer look found something.", findKind: "relic", timeMs: 20000 },
  rest: { label: "Rest together", toast: "A quiet rest.", bondXp: 20, timeMs: 10000 },
  shortcut: { label: "Take the shortcut", toast: "Shortcut taken.", timeMs: -25000, ambushChance: .25 },
};

export function regionContent(pathId: string) {
  return REGION_CONTENT.find((region) => region.id === pathId) ?? null;
}

export function journeyContent(pathId: string) {
  return regionContent(pathId)?.journey ?? FALLBACK_JOURNEY;
}

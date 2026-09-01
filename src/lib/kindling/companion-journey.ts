import type { SpeciesId } from "./model";

export type CompanionJourneyTrait = {
  name: string;
  summary: string;
  investigateExtra: boolean;
  investigateTimeDelta: number;
  restBondBonus: number;
  restTimeDelta: number;
  shortcutTimeDelta: number;
  ambushMultiplier: number;
  ambushGuard: number;
};

const TRAITS: Record<SpeciesId, CompanionJourneyTrait> = {
  ember: {
    name: "Hearthsense",
    summary: "Ember settles quickly at safe rests.",
    investigateExtra: false,
    investigateTimeDelta: 0,
    restBondBonus: 10,
    restTimeDelta: -2_000,
    shortcutTimeDelta: 0,
    ambushMultiplier: 1,
    ambushGuard: 0,
  },
  mossling: {
    name: "Forager",
    summary: "Mossling notices useful things others walk past.",
    investigateExtra: true,
    investigateTimeDelta: -8_000,
    restBondBonus: 0,
    restTimeDelta: 0,
    shortcutTimeDelta: 0,
    ambushMultiplier: 1,
    ambushGuard: 0,
  },
  ashling: {
    name: "Quickstep",
    summary: "Ashling turns shortcuts into fast, evasive routes.",
    investigateExtra: false,
    investigateTimeDelta: 0,
    restBondBonus: 0,
    restTimeDelta: 0,
    shortcutTimeDelta: -10_000,
    ambushMultiplier: 0.5,
    ambushGuard: 0,
  },
  mossknight: {
    name: "Bulwark",
    summary: "Moss Knight is hard to surprise and starts ambushes braced.",
    investigateExtra: false,
    investigateTimeDelta: 0,
    restBondBonus: 0,
    restTimeDelta: 0,
    shortcutTimeDelta: 0,
    ambushMultiplier: 0.35,
    ambushGuard: 4,
  },
};

export function journeyTraitFor(species?: SpeciesId | null) {
  return species ? TRAITS[species] : null;
}

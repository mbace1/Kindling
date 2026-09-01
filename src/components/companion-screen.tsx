import { CompanionCombatGrowthPanel } from "@/components/companion-combat-growth-panel";
import { CompanionResponsive } from "@/components/companion-responsive";

export function CompanionScreen() {
  return (
    <>
      <CompanionResponsive />
      <CompanionCombatGrowthPanel />
    </>
  );
}

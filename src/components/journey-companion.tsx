import { EmberAtlasSprite } from "@/components/ember-atlas-sprite";
import { portraitSrc, type SpeciesId } from "@/lib/kindling/model";

export function JourneyCompanion({ species }: { species: SpeciesId }) {
  if (species === "ember") {
    return <EmberAtlasSprite mode="walk" className="h-20 w-20 drop-shadow-[0_5px_3px_rgba(0,0,0,0.35)] sm:h-24 sm:w-24" />;
  }
  return <img src={portraitSrc(species)} alt="" className="h-20 w-20 object-contain drop-shadow-[0_5px_3px_rgba(0,0,0,0.35)] sm:h-24 sm:w-24" />;
}

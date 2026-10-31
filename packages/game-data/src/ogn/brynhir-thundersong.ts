import { defineUnit } from '../unit-definition.js';
/** OGN-026 : à la mise en jeu, les adversaires ne peuvent plus jouer de carte ce tour. */
export const brynhirThundersong = defineUnit({
  id: 'ogn-026-298',
  name: 'Brynhir Thundersong',
  type: 'unit',
  cost: { energy: 6, power: {} },
  might: 5,
  onPlayEffect: { type: 'lock-opponents' },
  text: "When you play me, opponents can't play cards this turn.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/44e805aa0f2928acf1156eef692403df319b333a-744x1039.png?accountingTag=RB',
});

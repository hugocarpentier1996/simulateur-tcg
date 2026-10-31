import { defineUnit } from '../unit-definition.js';
/** OGN-066 : quand elle tient son champ, son propriétaire marque 1 point (effet de carte). */
export const ahriCalm = defineUnit({
  id: 'ogn-066-298',
  name: 'Ahri',
  type: 'unit',
  cost: { energy: 5, power: { vert: 1 } },
  might: 4,
  onHoldScore: 1,
  text: 'When I hold, you score 1 point.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/fabbcc2f83f397cf07299236a702db05a151053b-744x1039.png?accountingTag=RB',
});

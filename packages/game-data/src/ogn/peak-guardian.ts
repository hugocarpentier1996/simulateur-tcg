import { defineUnit } from '../unit-definition.js';
/** OGN-223 : à la mise en jeu, se buffe ; puis, s'il est sur un champ, buffe les autres
 * unités alliées de ce champ. */
export const peakGuardian = defineUnit({
  id: 'ogn-223-298',
  name: 'Peak Guardian',
  type: 'unit',
  cost: { energy: 6, power: { jaune: 1 } },
  might: 5,
  onPlayEffect: { type: 'buff-self', alliesHere: true },
  text: "When you play me, buff me. Then, if I am at a battlefield, buff all other friendly units there. (To buff a unit, give it a +1 {might} buff if it doesn't already have one.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/bb56433bc032fd31a957923c43babc48b66db24c-744x1039.png?accountingTag=RB',
});

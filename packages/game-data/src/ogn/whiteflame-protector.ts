import { defineUnit } from '../unit-definition.js';
/** OGN-082 : à la mise en jeu, +8 Might à une unité (lui-même compris) jusqu'à la fin du tour. */
export const whiteflameProtector = defineUnit({
  id: 'ogn-082-298',
  name: 'Whiteflame Protector',
  type: 'unit',
  cost: { energy: 8, power: { vert: 2 } },
  might: 8,
  onPlayTargetEffect: { effect: { type: 'modify-might', amount: 8 } },
  text: 'When you play me, give a unit +8 {might} this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/a5cdd793736f915fa1b4ea388af66de7b2bc00cb-744x1039.png?accountingTag=RB',
});

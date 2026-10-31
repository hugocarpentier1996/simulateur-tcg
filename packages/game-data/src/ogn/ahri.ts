import { defineUnit } from '../unit-definition.js';
/** OGN-119 : en attaquant ou en défendant, -2 Might (minimum 1) à une unité ennemie ici. */
export const ahri = defineUnit({
  id: 'ogn-119-298',
  name: 'Ahri',
  type: 'unit',
  cost: { energy: 3, power: { bleu: 1 } },
  might: 3,
  onAttackTargetEffect: {
    type: 'weaken',
    amount: 2,
    minimum: 1,
    defendToo: true,
  },
  text: 'When I attack or defend, give an enemy unit here -2 {might} this turn, to a minimum of 1 {might}.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/cfa28e1abcac1db780d11e82985e13ee5978290d-744x1039.png?accountingTag=RB',
});

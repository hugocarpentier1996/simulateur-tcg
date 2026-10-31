import { defineUnit } from '../unit-definition.js';
/** OGN-051 : à la mise en jeu, Stun d'une unité jusqu'à la fin du tour. */
export const solariShieldbearer = defineUnit({
  id: 'ogn-051-298',
  name: 'Solari Shieldbearer',
  type: 'unit',
  cost: { energy: 3, power: {} },
  might: 2,
  onPlayTargetEffect: { effect: { type: 'stun' } },
  text: "When you play me, stun a unit. (It doesn't deal combat damage this turn.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/9387ea6480c9fd6991760b07a178c07a5fcf1c57-744x1039.png?accountingTag=RB',
});

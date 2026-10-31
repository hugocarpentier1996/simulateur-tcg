import { defineUnit } from '../unit-definition.js';
/** OGN-225 : à la mise en jeu, une unité ennemie : tuée si Stun, sinon Stun. */
export const solariChief = defineUnit({
  id: 'ogn-225-298',
  name: 'Solari Chief',
  type: 'unit',
  cost: { energy: 5, power: { jaune: 1 } },
  might: 4,
  onPlayTargetEffect: {
    allegiance: 'enemy',
    effect: { type: 'kill-if-stunned-else-stun' },
  },
  text: "When you play me, choose an enemy unit. If it is stunned, kill it. Otherwise, stun it. (It doesn't deal combat damage this turn.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/02fd791fdaa7d1c63221655e889fb412de103ca2-744x1039.png?accountingTag=RB',
});

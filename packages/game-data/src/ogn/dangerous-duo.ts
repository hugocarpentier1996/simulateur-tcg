import { defineUnit } from '../unit-definition.js';
/** OGN-016 : Legion — à la mise en jeu, +2 Might à une unité ce tour. */
export const dangerousDuo = defineUnit({
  id: 'ogn-016-298',
  name: 'Dangerous Duo',
  type: 'unit',
  cost: { energy: 3, power: {} },
  might: 3,
  onPlayTargetEffect: {
    legion: true,
    effect: { type: 'modify-might', amount: 2 },
  },
  text: "[Legion] — When you play me, give a unit +2 {might} this turn. (Get the effect if you've played another card this turn.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/3c02ea9e438d407c739276b788e015ac93843651-744x1039.png?accountingTag=RB',
});

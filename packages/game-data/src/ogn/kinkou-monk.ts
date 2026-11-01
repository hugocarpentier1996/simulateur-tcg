import { defineUnit } from '../unit-definition.js';
/** OGN-141 : à la mise en jeu, buffe jusqu'à deux autres unités alliées (choisies au jeu). */
export const kinkouMonk = defineUnit({
  id: 'ogn-141-298',
  name: 'Kinkou Monk',
  type: 'unit',
  might: 4,
  cost: { energy: 4, power: { orange: 1 } },
  onPlayBuffOthers: 2,
  text: "When you play me, buff up to two other friendly units. (Each one that doesn't have a buff gets a +1 {might} buff.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/648b22c6f419ee55723247bbf4c3ac10f0be9ab5-744x1039.png?accountingTag=RB',
});

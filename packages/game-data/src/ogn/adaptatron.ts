import { defineUnit } from '../unit-definition.js';
/** OGN-056 : à la conquête, peut détruire un gear ; si oui, se buffe. */
export const adaptatron = defineUnit({
  id: 'ogn-056-298',
  name: 'Adaptatron',
  type: 'unit',
  might: 3,
  cost: { energy: 4, power: {} },
  onConquerKillGearBuff: true,
  text: "When I conquer, you may kill a gear. If you do, buff me. (If I don't have a buff, I get a +1 {might} buff.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/a3ddb00a2a872eaceb96469739531414aa27455d-744x1039.png?accountingTag=RB',
});

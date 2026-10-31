import { defineUnit } from '../unit-definition.js';
/** OGN-012 : Legion — coûte 2 énergie de moins. */
export const noxusHopeful = defineUnit({
  id: 'ogn-012-298',
  name: 'Noxus Hopeful',
  type: 'unit',
  cost: { energy: 4, power: {} },
  might: 4,
  legionEnergyReduction: 2,
  text: "[Legion] — I cost {energy:2} less. (Get the effect if you've played another card this turn.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/c3bb6f4cb58feeb50e396d12ec9865c5434025af-744x1039.png?accountingTag=RB',
});

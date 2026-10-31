import { defineUnit } from '../unit-definition.js';
/** OGN-140 : les Dragons de son propriétaire coûtent 2 énergie de moins, minimum 1. */
export const heraldOfScales = defineUnit({
  id: 'ogn-140-298',
  name: 'Herald of Scales',
  type: 'unit',
  cost: { energy: 4, power: {} },
  might: 3,
  dragonEnergyReduction: 2,
  text: "Your Dragons' Energy costs are reduced by {energy:2}, to a minimum of {energy:1}.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/be49bceea1d328769774fb4daac4732861f6e4fd-744x1039.png?accountingTag=RB',
});

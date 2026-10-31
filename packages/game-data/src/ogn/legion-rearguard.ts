import { defineUnit } from '../unit-definition.js';
/** OGN-010 : Accelerate (1 énergie + 1 Fury en plus pour arriver Ready). */
export const legionRearguard = defineUnit({
  id: 'ogn-010-298',
  name: 'Legion Rearguard',
  type: 'unit',
  cost: { energy: 2, power: {} },
  might: 2,
  accelerate: { power: 'rouge' },
  text: '[Accelerate] (You may pay {energy:1}{power:fury} as an additional cost to have me enter ready.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/aedece01c7792c689050460db1670e6b9b15b61f-744x1039.png?accountingTag=RB',
});

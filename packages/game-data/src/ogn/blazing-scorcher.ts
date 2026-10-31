import { defineUnit } from '../unit-definition.js';
/** OGN-001 : Accelerate (Fury). */
export const blazingScorcher = defineUnit({
  id: 'ogn-001-298',
  name: 'Blazing Scorcher',
  type: 'unit',
  cost: { energy: 5, power: {} },
  might: 5,
  accelerate: { power: 'rouge' },
  text: '[Accelerate] (You may pay {energy:1}{power:fury} as an additional cost to have me enter ready.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/15ed971e4029a92b362a81ccadf309fb81e40b81-744x1039.png?accountingTag=RB',
});

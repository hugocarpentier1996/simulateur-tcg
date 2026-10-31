import { defineUnit } from '../unit-definition.js';
/** OGN-039 : Accelerate (Fury) ; quand elle conquiert, pioche 1. */
export const kaiSaFury = defineUnit({
  id: 'ogn-039-298',
  name: "Kai'Sa",
  type: 'unit',
  cost: { energy: 4, power: {} },
  might: 4,
  accelerate: { power: 'rouge' },
  onConquerDraw: 1,
  text: '[Accelerate] (You may pay {energy:1}{power:fury} as an additional cost to have me enter ready.)\nWhen I conquer, draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/3d942c02ad4e96a36dba14d663c5105bb6614500-744x1039.png?accountingTag=RB',
});

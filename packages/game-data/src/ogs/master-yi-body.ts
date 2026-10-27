import { defineUnit } from '../unit-definition.js';

/** OGS-009/024 — version Body, distincte du Master Yi Calm OGS-004. */
export const masterYiBody = defineUnit({
  id: 'ogs-009-024',
  name: 'Master Yi',
  type: 'unit',
  cost: { energy: 7, power: { orange: 1 } },
  might: 6,
  entersReady: true,
  ganking: true,
  text: '[Ganking] (I can move from battlefield to battlefield.)\nI enter ready.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/0e16976cd6d7ee5a874be9351b428671990fbd25-744x1039.png?accountingTag=RB',
});

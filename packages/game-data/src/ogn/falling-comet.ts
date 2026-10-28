import { defineSpell } from '../spell-definition.js';
export const fallingComet = defineSpell({
  id: 'ogn-085-298',
  name: 'Falling Comet',
  type: 'spell',
  timing: 'action',
  cost: { energy: 5, power: {} },
  target: { kind: 'unit', combatRole: 'any', zone: 'battlefield' },
  effects: [{ type: 'damage', amount: 6 }],
  text: '[Action] (Play on your turn or in showdowns.)\nDeal 6 to a unit at a battlefield.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/eaaf300a07d5b2927fe9a601d70f2a01b512cc7e-744x1039.png?accountingTag=RB',
});

import { defineSpell } from '../spell-definition.js';
export const disintegrate = defineSpell({
  id: 'ogn-005-298',
  name: 'Disintegrate',
  text: '[Action] (Play on your turn or in showdowns.)\nDeal 3 to a unit at a battlefield. If this kills it, draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/a27374ac3a81f3dfefb43c3c3237c23b4883cb5a-744x1039.png?accountingTag=RB',
  type: 'spell',
  timing: 'action',
  cost: { energy: 4, power: {} },
  target: { kind: 'unit', combatRole: 'any', zone: 'battlefield' },
  effects: [{ type: 'damage', amount: 3, drawIfKilled: 1 }],
});

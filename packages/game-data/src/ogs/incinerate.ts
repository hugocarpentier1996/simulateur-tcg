import { defineSpell } from '../spell-definition.js';

/** OGS-003/024 : dégâts ciblés sur une unité présente sur un battlefield. */
export const incinerate = defineSpell({
  id: 'ogs-003-024',
  name: 'Incinerate',
  type: 'spell',
  timing: 'action',
  cost: { energy: 2, power: {} },
  target: { kind: 'unit', combatRole: 'any', zone: 'battlefield' },
  effects: [{ type: 'damage', amount: 2 }],
  text: '[Action] (Play on your turn or in showdowns.)\nDeal 2 to a unit at a battlefield.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/46e4eaada1412f9b6c24751bdb3932c6a51e905f-744x1039.png?accountingTag=RB',
});

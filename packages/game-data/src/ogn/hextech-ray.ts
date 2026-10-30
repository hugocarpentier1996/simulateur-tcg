import { defineSpell } from '../spell-definition.js';
/** OGN-009 : dégâts ciblés sur une unité présente sur un champ de bataille. */
export const hextechRay = defineSpell({
  id: 'ogn-009-298',
  name: 'Hextech Ray',
  type: 'spell',
  timing: 'action',
  cost: { energy: 1, power: { rouge: 1 } },
  target: { kind: 'unit', combatRole: 'any', zone: 'battlefield' },
  effects: [{ type: 'damage', amount: 3 }],
  text: '[Action] (Play on your turn or in showdowns.)\nDeal 3 to a unit at a battlefield.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/1e7d12693822c38377ddc8f15db23e2f9b6d560a-744x1039.png?accountingTag=RB',
});

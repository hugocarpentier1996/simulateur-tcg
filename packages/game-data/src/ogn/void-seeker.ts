import { defineSpell } from '../spell-definition.js';
/** OGN-024 : 4 dégâts à une unité sur un champ, puis pioche 1. */
export const voidSeeker = defineSpell({
  id: 'ogn-024-298',
  name: 'Void Seeker',
  type: 'spell',
  timing: 'action',
  cost: { energy: 3, power: { rouge: 1 } },
  target: { kind: 'unit', combatRole: 'any', zone: 'battlefield' },
  effects: [
    { type: 'damage', amount: 4 },
    { type: 'draw', count: 1, player: 'caster' },
  ],
  text: '[Action] (Play on your turn or in showdowns.)\nDeal 4 to a unit at a battlefield. Draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/5b64b63c6be58ff3c33c7fb3c2dcb168d64e287e-744x1039.png?accountingTag=RB',
});

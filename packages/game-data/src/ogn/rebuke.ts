import { defineSpell } from '../spell-definition.js';
/** OGN-172 : renvoie une unité sur un champ dans la main de son propriétaire. */
export const rebuke = defineSpell({
  id: 'ogn-172-298',
  name: 'Rebuke',
  type: 'spell',
  timing: 'action',
  cost: { energy: 2, power: { violet: 2 } },
  target: { kind: 'unit', combatRole: 'any', zone: 'battlefield' },
  effects: [{ type: 'return-unit-to-hand' }],
  text: "[Action] (Play on your turn or in showdowns.)\nReturn a unit at a battlefield to its owner's hand.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/c8e1ad72e9d562f9267c1512f29e9c04dc5cc15f-744x1039.png?accountingTag=RB',
});

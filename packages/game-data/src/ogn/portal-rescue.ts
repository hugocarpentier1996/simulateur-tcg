import { defineSpell } from '../spell-definition.js';
/** OGN-102 : Action ; bannit une unité alliée puis la joue dans sa base, sans payer son coût. */
export const portalRescue = defineSpell({
  id: 'ogn-102-298',
  name: 'Portal Rescue',
  type: 'spell',
  timing: 'action',
  cost: { energy: 3, power: { bleu: 1 } },
  target: { kind: 'unit', combatRole: 'any', allegiance: 'friendly' },
  effects: [{ type: 'banish-replay' }],
  text: '[Action] (Play on your turn or in showdowns.)\nBanish a friendly unit, then play it to base, ignoring its cost.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/bafb4c68fa9a3eb71fecd0cdffb9e20b9f68d532-744x1039.png?accountingTag=RB',
});

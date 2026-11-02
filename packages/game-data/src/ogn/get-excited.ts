import { defineSpell } from '../spell-definition.js';
/** OGN-008 : Action ; défausse 1 carte (choisie à la résolution) et inflige son coût
 * en énergie à une unité sur un champ. */
export const getExcited = defineSpell({
  id: 'ogn-008-298',
  name: 'Get Excited!',
  type: 'spell',
  timing: 'action',
  cost: { energy: 2, power: { rouge: 1 } },
  target: { kind: 'unit', combatRole: 'any', zone: 'battlefield' },
  effects: [{ type: 'discard-for-damage' }],
  text: '[Action] (Play on your turn or in showdowns.)\nDiscard 1. Deal its Energy cost as damage to a unit at a battlefield. (Ignore its Power cost.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/2906c932c482af17fbb2979a8c42a6992f95d6a6-744x1039.png?accountingTag=RB',
});

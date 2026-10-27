import { defineSpell } from '../spell-definition.js';

/** OGS-012/024 : mort directe, sans dégâts, d'une unité sur un battlefield. */
export const blastOfPower = defineSpell({
  id: 'ogs-012-024',
  name: 'Blast of Power',
  type: 'spell',
  timing: 'action',
  cost: { energy: 6, power: { jaune: 1 } },
  target: { kind: 'unit', combatRole: 'any', zone: 'battlefield' },
  effects: [{ type: 'kill-unit' }],
  text: '[Action] (Play on your turn or in showdowns.)\nKill a unit at a battlefield.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/026f851a703601fce4142c0791e913377c170b47-744x1039.png?accountingTag=RB',
});

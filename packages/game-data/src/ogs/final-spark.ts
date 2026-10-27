import { defineSpell } from '../spell-definition.js';

/** OGS-022/024 : cible toute unité en jeu, y compris dans sa base. */
export const finalSpark = defineSpell({
  id: 'ogs-022-024',
  name: 'Final Spark',
  type: 'spell',
  timing: 'action',
  cost: { energy: 8, power: {} },
  target: { kind: 'unit', combatRole: 'any' },
  effects: [{ type: 'damage', amount: 8 }],
  text: '[Action] (Play on your turn or in showdowns.)\nDeal 8 to a unit.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/4558a2dc1bb1f1b8a73ec0d82244654e84b12687-744x1039.png?accountingTag=RB',
});

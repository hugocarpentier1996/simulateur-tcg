import { defineSpell } from '../spell-definition.js';
/** OGN-268 : Action ; paye X Power quelconque (xPower) pour infliger X à toutes les unités
 * ennemies d'un champ. */
export const bulletTime = defineSpell({
  id: 'ogn-268-298',
  name: 'Bullet Time',
  type: 'spell',
  timing: 'action',
  cost: { energy: 1, power: {} },
  variablePower: true,
  target: { kind: 'battlefield' },
  effects: [{ type: 'damage-enemies-at-battlefield-x' }],
  text: '[Action] (Play on your turn or in showdowns.)\nPay any amount of {power:any} to deal that much damage to all enemy units at a battlefield.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/96ed7f6b121a7f46003534393350838efe2776f0-744x1039.png?accountingTag=RB',
});

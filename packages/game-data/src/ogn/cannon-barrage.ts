import { defineSpell } from '../spell-definition.js';
export const cannonBarrage = defineSpell({
  id: 'ogn-127-298',
  name: 'Cannon Barrage',
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nDeal 2 to all enemy units in combat.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/07ef531829e5c6084a8d31044ebd783a9266f59e-744x1039.png?accountingTag=RB',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 2, power: { orange: 1 } },
  target: { kind: 'caster' },
  effects: [{ type: 'damage-enemies-in-combat', amount: 2 }],
});

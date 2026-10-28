import { defineSpell } from '../spell-definition.js';
export const meditation = defineSpell({
  id: 'ogn-048-298',
  name: 'Meditation',
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nAs an additional cost to play this, you may exhaust a friendly unit. If you do, draw 2. Otherwise, draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/7103336ab0d7f7bebdaa4155e4258d8d9beb06de-744x1039.png?accountingTag=RB',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 2, power: {} },
  optionalExhaustAlly: true,
  target: { kind: 'caster' },
  effects: [{ type: 'draw', count: 1, countIfExhausted: 2, player: 'caster' }],
});

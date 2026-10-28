import { defineSpell } from '../spell-definition.js';
export const backToBack = defineSpell({
  id: 'ogn-206-298',
  name: 'Back to Back',
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nGive two friendly units each +2 {might} this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/7f5585dcd3e9c7866e3b99cb169a0404ea4c010f-744x1039.png?accountingTag=RB',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 3, power: {} },
  target: { kind: 'caster' },
  effects: [
    {
      type: 'boost-selected-allies',
      count: 2,
      amount: 2,
      duration: 'end-of-turn',
    },
  ],
});

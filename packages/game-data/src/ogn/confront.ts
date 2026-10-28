import { defineSpell } from '../spell-definition.js';
export const confront = defineSpell({
  id: 'ogn-129-298',
  name: 'Confront',
  text: '[Action] (Play on your turn or in showdowns.)\nUnits you play this turn enter ready. Draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/691a38a7c344fdb5ee86e34d41321d99754286a7-744x1039.png?accountingTag=RB',
  type: 'spell',
  timing: 'action',
  cost: { energy: 2, power: {} },
  target: { kind: 'caster' },
  effects: [
    { type: 'units-enter-ready' },
    { type: 'draw', count: 1, player: 'caster' },
  ],
});

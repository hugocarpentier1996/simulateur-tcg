import { defineSpell } from '../spell-definition.js';
export const morbidReturn = defineSpell({
  id: 'ogn-170-298',
  name: 'Morbid Return',
  text: '[Action] (Play on your turn or in showdowns.)\nReturn a unit from your trash to your hand.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/33b5ca4e580b94f2056bd884a4a35e8c630920a2-744x1039.png?accountingTag=RB',
  type: 'spell',
  timing: 'action',
  cost: { energy: 2, power: {} },
  target: { kind: 'graveyard-unit' },
  effects: [{ type: 'return-graveyard-unit' }],
});

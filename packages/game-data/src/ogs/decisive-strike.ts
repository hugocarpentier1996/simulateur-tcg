import { defineSpell } from '../spell-definition.js';

/** OGS-024 : un Power orange OU jaune, bonus aux alliés présents à la résolution. */
export const decisiveStrike = defineSpell({
  id: 'ogs-024-024',
  name: 'Decisive Strike',
  type: 'spell',
  timing: 'action',
  cost: { energy: 5, power: {}, powerChoice: ['orange', 'jaune'] },
  target: { kind: 'caster' },
  effects: [{ type: 'boost-allies', amount: 2, duration: 'end-of-turn' }],
  text: '[Action] (Play on your turn or in showdowns.)\nGive friendly units +2 {might} this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/986782271be078c184a8d1c196e375106459c6c5-744x1039.png?accountingTag=RB',
});

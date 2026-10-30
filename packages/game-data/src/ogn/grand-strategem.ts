import { defineSpell } from '../spell-definition.js';
/** OGN-233 : +5 Might à toutes les unités alliées jusqu'à la fin du tour. */
export const grandStrategem = defineSpell({
  id: 'ogn-233-298',
  name: 'Grand Strategem',
  type: 'spell',
  timing: 'action',
  cost: { energy: 6, power: { jaune: 3 } },
  target: { kind: 'caster' },
  effects: [{ type: 'boost-allies', amount: 5, duration: 'end-of-turn' }],
  text: '[Action] (Play on your turn or in showdowns.)\nGive friendly units +5 {might} this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/bda7514aefa94ac3f368690cdd2d0f955d44c089-744x1039.png?accountingTag=RB',
});

import { defineSpell } from '../spell-definition.js';
export const gust = defineSpell({
  id: 'ogn-169-298',
  name: 'Gust',
  text: "[Reaction] (Play any time, even before spells and abilities resolve.)\nReturn a unit at a battlefield with 3 {might} or less to its owner's hand.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/dfd3b161ab76ba0c5d503384f1289b3395434b10-744x1039.png?accountingTag=RB',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 1, power: {} },
  target: {
    kind: 'unit',
    combatRole: 'any',
    zone: 'battlefield',
    maximumMight: 3,
  },
  effects: [{ type: 'return-unit-to-hand' }],
});

import { defineSpell } from '../spell-definition.js';
export const enGarde = defineSpell({
  id: 'ogn-046-298',
  name: 'En Garde',
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nGive a friendly unit +1 {might} this turn, then an additional +1 {might} this turn if it is the only unit you control there.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/03c0ec7eaa5957a62869dad2a0ce40913fc874a9-744x1039.png?accountingTag=RB',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 1, power: {} },
  target: { kind: 'unit', combatRole: 'any', allegiance: 'friendly' },
  effects: [
    { type: 'modify-might', amount: 1, aloneBonus: 1, duration: 'end-of-turn' },
  ],
});

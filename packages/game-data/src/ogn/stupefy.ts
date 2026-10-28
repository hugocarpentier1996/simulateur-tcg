import { defineSpell } from '../spell-definition.js';
export const stupefy = defineSpell({
  id: 'ogn-095-298',
  name: 'Stupefy',
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nGive a unit -1 {might} this turn, to a minimum of 1 {might}. Draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/837a5976192bbf8bdb4086429802167548ecc119-744x1039.png?accountingTag=RB',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 1, power: {} },
  target: { kind: 'unit', combatRole: 'any' },
  effects: [
    { type: 'modify-might', amount: -1, minimum: 1, duration: 'end-of-turn' },
    { type: 'draw', count: 1, player: 'caster' },
  ],
});

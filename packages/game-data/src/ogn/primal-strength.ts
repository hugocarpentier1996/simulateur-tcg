import { defineSpell } from '../spell-definition.js';
/** OGN-154 : +7 Might à une unité quelconque jusqu'à la fin du tour. */
export const primalStrength = defineSpell({
  id: 'ogn-154-298',
  name: 'Primal Strength',
  type: 'spell',
  timing: 'action',
  cost: { energy: 4, power: { orange: 1 } },
  target: { kind: 'unit', combatRole: 'any' },
  effects: [{ type: 'modify-might', amount: 7, duration: 'end-of-turn' }],
  text: '[Action] (Play on your turn or in showdowns.)\nGive a unit +7 {might} this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/dfd910a9836cd36340d0ffdb5fe8cb92a1069963-744x1039.png?accountingTag=RB',
});

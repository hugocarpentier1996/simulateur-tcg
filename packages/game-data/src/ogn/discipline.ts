import { defineSpell } from '../spell-definition.js';
/** OGN-058 : Réaction ; +2 Might à une unité jusqu'à la fin du tour, puis pioche 1. */
export const discipline = defineSpell({
  id: 'ogn-058-298',
  name: 'Discipline',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 2, power: {} },
  target: { kind: 'unit', combatRole: 'any' },
  effects: [
    { type: 'modify-might', amount: 2, duration: 'end-of-turn' },
    { type: 'draw', count: 1, player: 'caster' },
  ],
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nGive a unit +2 {might} this turn. Draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/8b9613970b505e3ad6abe2d51d091778314a7d48-744x1039.png?accountingTag=RB',
});

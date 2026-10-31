import { defineSpell } from '../spell-definition.js';
/** OGN-201 : chaque joueur défausse sa main, puis pioche 4. */
export const invertTimelines = defineSpell({
  id: 'ogn-201-298',
  name: 'Invert Timelines',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 3, power: { violet: 1 } },
  target: { kind: 'caster' },
  effects: [{ type: 'discard-hands-then-draw', count: 4 }],
  text: 'Each player discards their hand, then draws 4.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/b916326fdcf61af4630d953c7540a4aa97e6db01-744x1039.png?accountingTag=RB',
});

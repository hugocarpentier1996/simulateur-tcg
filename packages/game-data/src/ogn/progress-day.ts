import { defineSpell } from '../spell-definition.js';
/** OGN-114 : sort normal, le lanceur pioche 4. */
export const progressDay = defineSpell({
  id: 'ogn-114-298',
  name: 'Progress Day',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 6, power: { bleu: 1 } },
  target: { kind: 'caster' },
  effects: [{ type: 'draw', count: 4, player: 'caster' }],
  text: 'Draw 4.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/b15f479a8f29e31b6e4c06cf2d7c8cb8630073ef-744x1039.png?accountingTag=RB',
});

import { defineSpell } from '../spell-definition.js';
/** OGN-122 : son lanceur joue un tour après celui-ci ; la carte est bannie. */
export const timeWarp = defineSpell({
  id: 'ogn-122-298',
  name: 'Time Warp',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 10, power: { bleu: 4 } },
  target: { kind: 'caster' },
  effects: [{ type: 'extra-turn' }],
  banishOnResolve: true,
  text: 'Take a turn after this one. Banish this.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/b97bbcf3cf6cb6e5f4baaa1bfbb85dc860eb950b-744x1039.png?accountingTag=RB',
});

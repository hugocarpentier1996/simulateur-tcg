import { defineSpell } from '../spell-definition.js';
/** OGN-209 : chaque joueur tue une de ses unités (choix du lanceur, puis de l'adversaire). */
export const cullTheWeak = defineSpell({
  id: 'ogn-209-298',
  name: 'Cull the Weak',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 2, power: { jaune: 1 } },
  target: { kind: 'caster' },
  effects: [{ type: 'each-player-kills', what: 'unit' }],
  text: 'Each player kills one of their units.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/49338a4b31727c6ef50e7dbc54e7004dcd2b6f4c-744x1039.png?accountingTag=RB',
});

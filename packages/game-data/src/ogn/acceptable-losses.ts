import { defineSpell } from '../spell-definition.js';
/** OGN-179 : Action ; chaque joueur détruit un de ses gears (le lanceur d'abord). */
export const acceptableLosses = defineSpell({
  id: 'ogn-179-298',
  name: 'Acceptable Losses',
  type: 'spell',
  timing: 'action',
  cost: { energy: 1, power: {} },
  target: { kind: 'caster' },
  effects: [{ type: 'each-player-kills', what: 'gear' }],
  text: '[Action] (Play on your turn or in showdowns.)\nEach player kills one of their gear.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/b2b470bab1ae511ab9de0b1ce576e2050532a081-744x1039.png?accountingTag=RB',
});

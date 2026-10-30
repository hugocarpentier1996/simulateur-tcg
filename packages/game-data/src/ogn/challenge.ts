import { defineSpell } from '../spell-definition.js';
/** OGN-128 : une unité alliée et une unité ennemie, choisies au lancement, s'infligent
 * des dégâts égaux à leur Might (mêmes règles que le duel, sans bonus préalable). */
export const challenge = defineSpell({
  id: 'ogn-128-298',
  name: 'Challenge',
  type: 'spell',
  timing: 'action',
  cost: { energy: 2, power: { orange: 1 } },
  target: { kind: 'unit', combatRole: 'any', allegiance: 'friendly' },
  effects: [{ type: 'duel' }],
  text: '[Action] (Play on your turn or in showdowns.)\nChoose a friendly unit and an enemy unit. They deal damage equal to their Mights to each other.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/f5c1aeaee373c481b7ea2a638cd6f9e815ac105d-744x1039.png?accountingTag=RB',
});

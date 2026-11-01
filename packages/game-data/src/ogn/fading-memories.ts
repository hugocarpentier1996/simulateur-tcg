import { defineSpell } from '../spell-definition.js';
/** OGN-180 : une unité sur un champ ou un gear gagne Temporary (détruit au début de la
 * Beginning de son contrôleur, avant le score). */
export const fadingMemories = defineSpell({
  id: 'ogn-180-298',
  name: 'Fading Memories',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 4, power: { violet: 1 } },
  target: { kind: 'battlefield-unit-or-gear' },
  effects: [{ type: 'grant-temporary' }],
  text: "Give a unit at a battlefield or a gear [Temporary]. (Kill it at the start of its controller's Beginning Phase, before scoring.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/a2b366942f1a7ec1f4bd3c1b17e10356214705d7-744x1039.png?accountingTag=RB',
});

import { defineSpell } from '../spell-definition.js';
/** OGN-043 : sort normal, déplace une unité ennemie (sans exiger Ready, état conservé). */
export const charm = defineSpell({
  id: 'ogn-043-298',
  name: 'Charm',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 1, power: { vert: 1 } },
  target: { kind: 'unit', combatRole: 'any', allegiance: 'enemy' },
  effects: [{ type: 'move-unit', requiresReady: false, exhaustsUnit: false }],
  text: 'Move an enemy unit.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/62ae564505db8fcba70605eac2083ac2d4397b5a-744x1039.png?accountingTag=RB',
});

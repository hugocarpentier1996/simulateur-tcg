import { defineSpell } from '../spell-definition.js';
/** OGN-258 : déplace une unité ennemie, puis elle et une autre unité ennemie de sa destination
 * (secondaryTargetId) s'infligent leur Might. Power hybride Calm/Body. */
export const dragonsRage = defineSpell({
  id: 'ogn-258-298',
  name: "Dragon's Rage",
  type: 'spell',
  timing: 'normal',
  cost: { energy: 4, power: {}, powerChoice: ['vert', 'orange'] },
  target: { kind: 'unit', combatRole: 'any', allegiance: 'enemy' },
  effects: [
    { type: 'move-unit', requiresReady: false, exhaustsUnit: false },
    { type: 'fight-at-destination' },
  ],
  text: 'Move an enemy unit. Then choose another enemy unit at its destination. They deal damage equal to their Mights to each other.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/7f4cbd4fb340cc13b3fbe0ec0db706464d9b29f4-744x1039.png?accountingTag=RB',
});

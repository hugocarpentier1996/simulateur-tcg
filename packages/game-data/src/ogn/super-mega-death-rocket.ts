import { defineSpell } from '../spell-definition.js';
/** OGN-252 : inflige 5 à une unité ; quand son propriétaire conquiert, il peut défausser 1
 * pour la ramener de son cimetière en main. */
export const superMegaDeathRocket = defineSpell({
  id: 'ogn-252-298',
  name: 'Super Mega Death Rocket!',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 4, power: {}, powerChoice: ['rouge', 'violet'] },
  target: { kind: 'unit', combatRole: 'any' },
  effects: [{ type: 'damage', amount: 5 }],
  returnOnConquerDiscard: true,
  text: 'Deal 5 to a unit.\nWhen you conquer, you may discard 1 to return this from your trash to your hand.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/95d6fd4d7944e759cfe7ee5e208fa329b719333b-744x1039.png?accountingTag=RB',
});

import { defineUnit } from '../unit-definition.js';
/** OGN-165 : à la mise en jeu, récupère une unité de son cimetière dans sa main. */
export const cemeteryAttendant = defineUnit({
  id: 'ogn-165-298',
  name: 'Cemetery Attendant',
  type: 'unit',
  cost: { energy: 3, power: { violet: 1 } },
  might: 3,
  onPlayReturnUnit: true,
  text: 'When you play me, return a unit from your trash to your hand.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/6bbbe6923105c53fc6b2a44430db940e009609b6-744x1039.png?accountingTag=RB',
});

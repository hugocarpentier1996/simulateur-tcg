import { defineGear } from '../gear-definition.js';
/** OGN-101 : au début de la Beginning de son propriétaire, s'il contrôle une carte cachée sur
 * un champ, il pioche 1 (via la pile). */
export const mushroomPouch = defineGear({
  id: 'ogn-101-298',
  name: 'Mushroom Pouch',
  type: 'gear',
  cost: { energy: 2, power: {} },
  effects: [],
  beginningDrawIfFacedown: true,
  text: 'At the start of your Beginning Phase, if you control a facedown card at a battlefield, draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/ef5b3125fda91c0d0a02b7e6dfb7d3d5bafa8bd0-744x1039.png?accountingTag=RB',
});

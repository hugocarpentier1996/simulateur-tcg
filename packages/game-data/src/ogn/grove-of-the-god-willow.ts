import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-280 : quand son contrôleur le tient, il pioche 1. */
export const groveOfTheGodWillow = defineBattlefield({
  id: 'ogn-280-298',
  name: 'Grove of the God-Willow',
  type: 'battlefield',
  holdDraw: 1,
  text: 'When you hold here, draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/1574863000ab23d69cbd388a32b1a09f29f78d5f-1038x744.png?accountingTag=RB',
});

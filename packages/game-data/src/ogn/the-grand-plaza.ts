import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-293 : quand son contrôleur le tient avec 7 unités ou plus ici, il gagne la partie. */
export const theGrandPlaza = defineBattlefield({
  id: 'ogn-293-298',
  name: 'The Grand Plaza',
  type: 'battlefield',
  holdWinUnits: 7,
  text: 'When you hold here, if you have 7+ units here, you win the game.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/f9ca8d04cb269ad99bca7e6dae874cad1bec336a-1038x744.png?accountingTag=RB',
});

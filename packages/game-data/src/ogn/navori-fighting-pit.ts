import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-283 : quand son contrôleur le tient, il buffe une unité ici. */
export const navoriFightingPit = defineBattlefield({
  id: 'ogn-283-298',
  name: 'Navori Fighting Pit',
  type: 'battlefield',
  holdBuffHere: true,
  text: "When you hold here, buff a unit here. (If it doesn't have a buff, it gets a +1 {might} buff.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/c03ed3ddf8b764963e4b0745e86a12a5ebcef2a3-1038x744.png?accountingTag=RB',
});

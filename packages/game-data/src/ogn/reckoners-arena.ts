import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-286 : quand son contrôleur le tient, les effets « When I conquer » de ses unités
 * présentes ici se déclenchent. */
export const reckonersArena = defineBattlefield({
  id: 'ogn-286-298',
  name: "Reckoner's Arena",
  type: 'battlefield',
  holdActivatesConquer: true,
  text: 'When you hold here, activate the conquer effects of units here.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/6b7d867487efcbefa8c3d67043a839497ec50388-1038x744.png?accountingTag=RB',
});

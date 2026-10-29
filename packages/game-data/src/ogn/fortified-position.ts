import { defineBattlefield } from '../battlefield-definition.js';
export const fortifiedPosition = defineBattlefield({
  id: 'ogn-279-298',
  name: 'Fortified Position',
  text: "When you defend here, choose a unit. It gains [Shield 2] this combat. (+2 {might} while it's a defender.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/45363bbd907f4f3717868cb04b3cfed814b3bb32-1038x744.png?accountingTag=RB',
  type: 'battlefield',
  defenseShield: 2,
});

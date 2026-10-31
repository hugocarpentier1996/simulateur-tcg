import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-277 : une unité qui se déplace d'ici gagne +1 Might ce tour. */
export const backAlleyBar = defineBattlefield({
  id: 'ogn-277-298',
  name: 'Back-Alley Bar',
  type: 'battlefield',
  moveOutMightBonus: 1,
  text: 'When a unit moves from here, give it +1 {might} this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/3e9f659a32e390b45bc87a01bdd6af4a8a3565f7-1038x744.png?accountingTag=RB',
});

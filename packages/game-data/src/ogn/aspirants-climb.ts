import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-276 : en jeu, augmente de 1 le nombre de points nécessaires pour gagner. */
export const aspirantsClimb = defineBattlefield({
  id: 'ogn-276-298',
  name: "Aspirant's Climb",
  type: 'battlefield',
  victoryTargetBonus: 1,
  text: 'Increase the points needed to win the game by 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/9301593f3800e68427469d38181b578a672473c3-1038x744.png?accountingTag=RB',
});

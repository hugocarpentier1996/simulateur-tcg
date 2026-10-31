import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-290 : au début de la première Beginning de chaque joueur, il gagne 1 point. */
export const theArenasGreatest = defineBattlefield({
  id: 'ogn-290-298',
  name: "The Arena's Greatest",
  type: 'battlefield',
  firstBeginning: 'point',
  text: "At the start of each player's first Beginning Phase, that player gains 1 point.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/2afd8bdfdd42b1595af0746a6c6b92879ac770d6-1038x744.png?accountingTag=RB',
});

import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-295 : les unités ne peuvent pas se déplacer d'ici vers une base. */
export const vilemawsLair = defineBattlefield({
  id: 'ogn-295-298',
  name: "Vilemaw's Lair",
  type: 'battlefield',
  noMoveToBase: true,
  text: "Units can't move from here to base.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/f374b90a0bec11a5f423e7d4ebd869ab1a146471-1038x744.png?accountingTag=RB',
});

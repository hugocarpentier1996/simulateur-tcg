import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-289 : quand un joueur le conquiert, il redressera 2 runes à la fin de ce tour. */
export const targonsPeak = defineBattlefield({
  id: 'ogn-289-298',
  name: "Targon's Peak",
  type: 'battlefield',
  conquerEndTurnReadyRunes: 2,
  text: 'When you conquer here, ready 2 runes at the end of this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/6ff1b34ad231645910f670496e1662de0b545a44-1038x744.png?accountingTag=RB',
});

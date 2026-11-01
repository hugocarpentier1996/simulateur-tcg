import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-287 : quand un joueur le conquiert, il recycle une de ses runes (Tap d'abord, sans choix). */
export const sigilOfTheStorm = defineBattlefield({
  id: 'ogn-287-298',
  name: 'Sigil of the Storm',
  type: 'battlefield',
  conquerRecycleRune: true,
  text: 'When you conquer here, recycle one of your runes.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/9b795e7a2af421aabc01dc6f35c0b5d547fe3c0e-1038x744.png?accountingTag=RB',
});

import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-298 : quand un joueur le conquiert, il défausse 1 puis pioche 1. */
export const zaunWarrens = defineBattlefield({
  id: 'ogn-298-298',
  name: 'Zaun Warrens',
  type: 'battlefield',
  conquerLoot: true,
  text: 'When you conquer here, discard 1, then draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/458ee40086c77b43b98c2decbaf33a4aa2359bb9-1038x744.png?accountingTag=RB',
});

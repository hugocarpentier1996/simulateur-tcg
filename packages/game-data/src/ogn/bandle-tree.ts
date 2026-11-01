import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-278 : on peut y cacher une carte supplémentaire. */
export const bandleTree = defineBattlefield({
  id: 'ogn-278-298',
  name: 'Bandle Tree',
  type: 'battlefield',
  extraHiddenSlots: 1,
  text: 'You may hide an additional card here.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/538f93a34006c4afaddb890cbc75b4db222f1783-1038x744.png?accountingTag=RB',
});

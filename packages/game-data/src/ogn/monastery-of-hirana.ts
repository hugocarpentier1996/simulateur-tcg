import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-282 : quand un joueur le conquiert, il peut dépenser un buff pour piocher 1 (accepté
 * automatiquement s'il a une unité buffée). */
export const monasteryOfHirana = defineBattlefield({
  id: 'ogn-282-298',
  name: 'Monastery of Hirana',
  type: 'battlefield',
  conquerSpendBuffDraw: true,
  text: 'When you conquer here, you may spend a buff to draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/8767d9ed30e2873d3fa1045f973be229da56175d-1038x744.png?accountingTag=RB',
});

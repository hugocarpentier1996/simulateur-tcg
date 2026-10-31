import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-297 : les unités présentes ont Ganking. */
export const windsweptHillock = defineBattlefield({
  id: 'ogn-297-298',
  name: 'Windswept Hillock',
  type: 'battlefield',
  grantsGanking: true,
  text: 'Units here have [Ganking]. (They can move from battlefield to battlefield.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/aba557a4053fd76c6aa95b2b907ec682bad70d9f-1038x744.png?accountingTag=RB',
});

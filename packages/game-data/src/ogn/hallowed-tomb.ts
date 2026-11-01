import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-281 : à la tenue, son contrôleur peut ramener son Chosen Champion du cimetière dans sa
 * zone champion si elle est vide. */
export const hallowedTomb = defineBattlefield({
  id: 'ogn-281-298',
  name: 'Hallowed Tomb',
  type: 'battlefield',
  holdReturnChampion: true,
  text: 'When you hold here, you may return your Chosen Champion from your trash to your Champion Zone if it is empty.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/3e37a8cafd836680f82c31894de7f84818ebd952-1038x744.png?accountingTag=RB',
});

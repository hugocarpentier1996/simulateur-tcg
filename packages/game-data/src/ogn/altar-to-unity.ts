import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-275 : quand son contrôleur le tient, il joue un jeton Recrue 1 dans sa base. */
export const altarToUnity = defineBattlefield({
  id: 'ogn-275-298',
  name: 'Altar to Unity',
  type: 'battlefield',
  holdSummonBase: 'ogs-recruit-token',
  text: 'When you hold here, play a 1 {might} Recruit unit token in your base.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/2392529560dc9af72596c6fc65b4c0356bbc44d1-1038x744.png?accountingTag=RB',
});

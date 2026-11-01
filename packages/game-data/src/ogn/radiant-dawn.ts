import { defineLegend } from '../legend-definition.js';
/** OGN-261 : quand son propriétaire étourdit une ou plusieurs unités ennemies, il buffe une
 * unité alliée (choisie automatiquement : sans buff d'abord). */
export const radiantDawn = defineLegend({
  id: 'ogn-261-298',
  name: 'Radiant Dawn',
  type: 'legend',
  colors: ['vert', 'jaune'],
  buffOnEnemyStunned: true,
  text: "When you stun one or more enemy units, buff a friendly unit. (If it doesn't have a buff, it gets a +1 {might} buff.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/822b8bc7987a47498550708b18ef166b121fd620-744x1039.png?accountingTag=RB',
});

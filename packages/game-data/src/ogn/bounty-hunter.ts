import { defineLegend } from '../legend-definition.js';
/** OGN-267 : Tap — une unité gagne Ganking ce tour. */
export const bountyHunter = defineLegend({
  id: 'ogn-267-298',
  name: 'Bounty Hunter',
  type: 'legend',
  colors: ['orange', 'violet'],
  tapAbility: { target: {}, effect: { type: 'grant-ganking' } },
  text: '{exhaust}: Give a unit [Ganking] this turn. (It can move from battlefield to battlefield.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/e0635cebc3dd8ee5355dbbc090ca27ebeacebad7-744x1039.png?accountingTag=RB',
});

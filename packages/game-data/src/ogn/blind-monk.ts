import { defineLegend } from '../legend-definition.js';
/** OGN-257 : 1 énergie, Tap — buffe une unité alliée. */
export const blindMonk = defineLegend({
  id: 'ogn-257-298',
  name: 'Blind Monk',
  type: 'legend',
  colors: ['vert', 'orange'],
  tapAbility: {
    cost: { energy: 1, power: {} },
    target: { allegiance: 'friendly' },
    effect: { type: 'buff' },
  },
  text: "{energy:1}, {exhaust}: Buff a friendly unit. (If it doesn't have a buff, it gets a +1 {might} buff.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/ffe064e002d3b9a366748eb85102a769b2545835-744x1039.png?accountingTag=RB',
});

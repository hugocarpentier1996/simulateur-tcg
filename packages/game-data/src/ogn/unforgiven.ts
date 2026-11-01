import { defineLegend } from '../legend-definition.js';
/** OGN-259 : 2 énergie, Tap — déplace une unité alliée d'un champ vers sa base, ou de sa base
 * vers un champ. */
export const unforgiven = defineLegend({
  id: 'ogn-259-298',
  name: 'Unforgiven',
  type: 'legend',
  colors: ['vert', 'violet'],
  tapAbility: {
    cost: { energy: 2, power: {} },
    target: { allegiance: 'friendly' },
    effect: { type: 'move-to-or-from-base' },
  },
  text: '{energy:2}, {exhaust}: Move a friendly unit to or from your base.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/33e3d5596de0f560087d40414d62b8245d1dbb0d-744x1039.png?accountingTag=RB',
});

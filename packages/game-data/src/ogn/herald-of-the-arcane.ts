import { defineLegend } from '../legend-definition.js';
/** OGN-265 : 1 énergie, Tap — joue un jeton Recrue 1 dans sa base. */
export const heraldOfTheArcane = defineLegend({
  id: 'ogn-265-298',
  name: 'Herald of the Arcane',
  type: 'legend',
  colors: ['bleu', 'jaune'],
  tapAbility: {
    cost: { energy: 1, power: {} },
    target: {},
    effect: { type: 'summon-base', definitionId: 'ogs-recruit-token' },
  },
  text: '{energy:1}, {exhaust}: Play a 1 {might} Recruit unit token.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/913236dabf1e4f71650bbba46870fff8163e2eff-744x1039.png?accountingTag=RB',
});

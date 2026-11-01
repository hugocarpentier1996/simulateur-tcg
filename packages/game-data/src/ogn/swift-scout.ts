import { defineLegend } from '../legend-definition.js';
/** OGN-263 : cacher peut se payer 1 énergie au lieu d'1 Power ; 1 énergie, Tap : met en main
 * un Teemo à soi depuis sa zone champion ou le plateau. */
export const swiftScout = defineLegend({
  id: 'ogn-263-298',
  name: 'Swift Scout',
  type: 'legend',
  colors: ['bleu', 'violet'],
  hideWithEnergy: true,
  tapAbility: {
    cost: { energy: 1, power: {} },
    target: { allegiance: 'friendly' },
    effect: { type: 'tag-to-hand', tag: 'Teemo' },
  },
  text: 'You may pay {energy:1} to hide a card with [Hidden] instead of {power:any}.\n{energy:1}, {exhaust}: Put a Teemo unit you own into your hand from your Champion Zone or the board.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/9723181e3392bb61c2aabc804a44f7b0558cedf1-744x1039.png?accountingTag=RB',
});

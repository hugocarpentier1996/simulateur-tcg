import { defineLegend } from '../legend-definition.js';
/** OGN-249 : quand son propriétaire joue une unité Mighty, il peut coucher la légende pour
 * canaliser 1 rune Tap (appliqué automatiquement si la légende est Ready). */
export const relentlessStorm = defineLegend({
  id: 'ogn-249-298',
  name: 'Relentless Storm',
  type: 'legend',
  colors: ['rouge', 'orange'],
  mightyPlayChannel: 1,
  text: 'When you play a [Mighty] unit, you may exhaust me to channel 1 rune exhausted. (A unit is Mighty while it has 5+ {might}.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/8ef9c1827ccbba313d4591275e831854afffa5b1-744x1039.png?accountingTag=RB',
});

import { defineUnit } from '../unit-definition.js';
/** OGN-216 : Deathknell — canalise 1 rune Tap. */
export const soaringScout = defineUnit({
  id: 'ogn-216-298',
  name: 'Soaring Scout',
  type: 'unit',
  cost: { energy: 2, power: {} },
  might: 1,
  onDeath: { type: 'channel-exhausted', count: 1 },
  text: '[Deathknell] — Channel 1 rune exhausted. (When I die, get the effect.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/75b6ce420888035b566c3795cabe0999a9a918b0-744x1039.png?accountingTag=RB',
});

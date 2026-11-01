import { defineUnit } from '../unit-definition.js';
/** OGN-246 : quand une autre unité non-Recrue de son propriétaire meurt, joue un jeton Recrue 1
 * dans sa base (sans pile). */
export const viktorOrder = defineUnit({
  id: 'ogn-246-298',
  name: 'Viktor',
  type: 'unit',
  cost: { energy: 4, power: { jaune: 1 } },
  might: 4,
  recruitOnAllyDeath: 'ogs-recruit-token',
  text: 'When another non-Recruit unit you control dies, play a 1 {might} Recruit unit token into your base.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/ab390d6d074c3f07abba000cc166faa1796ec464-744x1039.png?accountingTag=RB',
});

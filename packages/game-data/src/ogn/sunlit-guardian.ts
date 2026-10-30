import { defineUnit } from '../unit-definition.js';
/** OGN-054 : Shield (+1 Might en défense) et Tank. */
export const sunlitGuardian = defineUnit({
  id: 'ogn-054-298',
  name: 'Sunlit Guardian',
  type: 'unit',
  cost: { energy: 3, power: {} },
  might: 3,
  shield: 1,
  tank: true,
  text: "[Shield] (+1 {might} while I'm a defender.)\n[Tank] (I must be assigned combat damage first.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/28bce7a662b9008f65565300f828d98790a641e1-744x1039.png?accountingTag=RB',
});

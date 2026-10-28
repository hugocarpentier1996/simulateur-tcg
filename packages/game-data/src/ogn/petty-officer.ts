import { defineUnit } from '../unit-definition.js';
export const pettyOfficer = defineUnit({
  id: 'ogn-215-298',
  name: 'Petty Officer',
  type: 'unit',
  cost: { energy: 5, power: {} },
  might: 5,
  text: "[Assault] (+1 {might} while I'm an attacker.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/29e062c4a38c0be12056568a2f8563557e2611c6-744x1039.png?accountingTag=RB',
  assault: 1,
});

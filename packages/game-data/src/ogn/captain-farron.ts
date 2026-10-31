import { defineUnit } from '../unit-definition.js';
/** OGN-015 : les autres unités alliées ici ont Assault (+1 Might en attaque). */
export const captainFarron = defineUnit({
  id: 'ogn-015-298',
  name: 'Captain Farron',
  type: 'unit',
  cost: { energy: 4, power: { rouge: 1 } },
  might: 5,
  otherAlliesHereAssault: 1,
  text: "Other friendly units here have [Assault]. (+1 {might} while they're attackers.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/4c65e2cae6748590f589ad8b26bc5a20c0d770c2-744x1039.png?accountingTag=RB',
});

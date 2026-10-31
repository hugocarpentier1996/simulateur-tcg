import { defineUnit } from '../unit-definition.js';
import { recruitToken } from '../ogs/recruit-the-vanguard.js';
/** OGN-239 : Deathknell — trois jetons Recruit de 1 Might dans la base du propriétaire. */
export const machineEvangel = defineUnit({
  id: 'ogn-239-298',
  name: 'Machine Evangel',
  type: 'unit',
  cost: { energy: 5, power: { jaune: 1 } },
  might: 4,
  onDeath: {
    type: 'summon-tokens-base',
    definitionId: recruitToken.id,
    count: 3,
  },
  text: '[Deathknell] — Play three 1 {might} Recruit unit tokens into your base. (When I die, get the effect.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/ad15d4ff89548e83dcede9b209b12233652cf3a1-744x1039.png?accountingTag=RB',
});

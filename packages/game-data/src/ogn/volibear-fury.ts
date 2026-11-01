import { defineUnit } from '../unit-definition.js';
/** OGN-041 : Deflect 2 ; en attaquant, 5 dégâts répartis entre des unités ennemies ici. */
export const volibearFury = defineUnit({
  id: 'ogn-041-298',
  name: 'Volibear',
  type: 'unit',
  might: 9,
  cost: { energy: 10, power: { rouge: 2 } },
  deflect: true,
  deflectAmount: 2,
  onAttackSplitDamage: 5,
  text: '[Deflect 2] (Opponents must pay {power:any}{power:any} to choose me with a spell or ability.)\nWhen I attack, deal 5 damage split among any number of enemy units here.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/c9165d49b8caae9a856433cd5151e8b368eb80b5-744x1039.png?accountingTag=RB',
});

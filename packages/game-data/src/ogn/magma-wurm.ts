import { defineUnit } from '../unit-definition.js';
/** OGN-011 : les autres unités alliées entrent en jeu Ready. */
export const magmaWurm = defineUnit({
  id: 'ogn-011-298',
  name: 'Magma Wurm',
  type: 'unit',
  cost: { energy: 8, power: { rouge: 1 } },
  might: 8,
  otherAlliesEnterReady: true,
  text: 'Other friendly units enter ready.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/f6565b15f65f538804e6a56623c8aa2eedeffc22-744x1039.png?accountingTag=RB',
});

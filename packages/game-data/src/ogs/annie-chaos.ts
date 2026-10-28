import { defineUnit } from '../unit-definition.js';
/** OGS-010 : choix de récupération à l'empilement, effet réactif. */
export const annieChaos = defineUnit({
  id: 'ogs-010-024',
  name: 'Annie',
  type: 'unit',
  cost: { energy: 4, power: { violet: 1 } },
  might: 3,
  onPlayReturnSpell: true,
  text: 'When you play me, return a spell from your trash to your hand.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/44eb968cf0c54e75970588b69eef5c5f5ccc9b24-744x1039.png?accountingTag=RB',
});

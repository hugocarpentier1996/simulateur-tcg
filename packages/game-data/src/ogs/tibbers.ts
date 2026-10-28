import { defineUnit } from '../unit-definition.js';

/** OGS-018/024 : deux Power rouge/violet, capacité de dégâts à la mise en jeu. */
export const tibbers = defineUnit({
  id: 'ogs-018-024',
  name: 'Tibbers',
  type: 'unit',
  cost: {
    energy: 8,
    power: {},
    powerChoice: ['rouge', 'violet'],
    powerChoiceAmount: 2,
  },
  might: 7,
  onPlayBattlefieldDamage: 3,
  text: 'When you play me, deal 3 to all units at battlefields.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/74f8bc78573b33d9979b0e9c121b858d770a490c-744x1039.png?accountingTag=RB',
});

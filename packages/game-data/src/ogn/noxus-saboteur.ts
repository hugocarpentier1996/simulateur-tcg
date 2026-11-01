import { defineUnit } from '../unit-definition.js';
/** OGN-018 : les cartes cachées des adversaires ne peuvent pas être révélées (jouées) ici. */
export const noxusSaboteur = defineUnit({
  id: 'ogn-018-298',
  name: 'Noxus Saboteur',
  type: 'unit',
  might: 3,
  cost: { energy: 3, power: {} },
  blocksEnemyHidden: true,
  text: "Your opponents' [Hidden] cards can't be revealed here.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/b78f0c822cb984db24ac3f1956cc8c10f8f88b22-744x1039.png?accountingTag=RB',
});

import { defineUnit } from '../unit-definition.js';
/** OGN-118 : la première fois chaque tour qu'une unité alliée meurt, son propriétaire pioche 1. */
export const wraithOfEchoes = defineUnit({
  id: 'ogn-118-298',
  name: 'Wraith of Echoes',
  type: 'unit',
  cost: { energy: 6, power: { bleu: 1 } },
  might: 5,
  drawOnFirstAllyDeath: true,
  text: 'The first time a friendly unit dies each turn, draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/10785ab5267ca3ff2dea081d8d18ba47c3858517-744x1039.png?accountingTag=RB',
});

import { defineUnit } from '../unit-definition.js';
/** OGN-205 : Ganking ; à son troisième déplacement du tour, son propriétaire marque 1 point. */
export const yasuoChaos = defineUnit({
  id: 'ogn-205-298',
  name: 'Yasuo',
  type: 'unit',
  cost: { energy: 5, power: { violet: 1 } },
  might: 4,
  ganking: true,
  scoreOnThirdMove: true,
  text: '[Ganking] (I can move from battlefield to battlefield.)\nThe third time I move in a turn, you score 1 point.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/f5ba378ce4dad16d17e001814e091d5f484f2681-744x1039.png?accountingTag=RB',
});

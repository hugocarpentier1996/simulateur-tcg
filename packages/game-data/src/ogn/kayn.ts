import { defineUnit } from '../unit-definition.js';
/** OGN-189 : Ganking ; ne subit aucun dégât s'il s'est déplacé deux fois ce tour. */
export const kayn = defineUnit({
  id: 'ogn-189-298',
  name: 'Kayn',
  type: 'unit',
  cost: { energy: 6, power: { violet: 1 } },
  might: 6,
  ganking: true,
  noDamageAfterMoves: 2,
  text: "[Ganking] (I can move from battlefield to battlefield.)\nIf I have moved twice this turn, I don't take damage.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/a1ce0e784264748f170bebb3b26a09a7f55efe0f-744x1039.png?accountingTag=RB',
});

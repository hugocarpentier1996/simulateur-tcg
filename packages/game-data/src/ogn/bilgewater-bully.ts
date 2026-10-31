import { defineUnit } from '../unit-definition.js';
/** OGN-125 : Ganking tant qu'il est buffé. */
export const bilgewaterBully = defineUnit({
  id: 'ogn-125-298',
  name: 'Bilgewater Bully',
  type: 'unit',
  cost: { energy: 6, power: {} },
  might: 6,
  buffedGanking: true,
  text: "While I'm buffed, I have [Ganking]. (I can move from battlefield to battlefield.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/474f66ffa1ecebd9e0341d644cb82a3b8135eece-744x1039.png?accountingTag=RB',
});

import { defineUnit } from '../unit-definition.js';
/** OGN-036 : Ganking ; recycler 1 carte de son cimetière : +1 Might ce tour. */
export const vi = defineUnit({
  id: 'ogn-036-298',
  name: 'Vi',
  type: 'unit',
  might: 3,
  cost: { energy: 2, power: { rouge: 1 } },
  ganking: true,
  trashRecycleMight: 1,
  text: '[Ganking] (I can move from battlefield to battlefield.)\nRecycle 1 from your trash: Give me +1 {might} this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/7ab52254ac49b8853fc7ae65b03aaee3f8c5994a-744x1039.png?accountingTag=RB',
});

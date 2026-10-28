import { defineUnit } from '../unit-definition.js';
export const noxianDrummer = defineUnit({
  id: 'ogn-222-298',
  name: 'Noxian Drummer',
  text: 'When I move to a battlefield, play a 1 {might} Recruit unit token here. (It is also at the battlefield.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/45a69adf92b6951c8c8fa974273c22aade312068-744x1039.png?accountingTag=RB',
  type: 'unit',
  might: 3,
  cost: { energy: 3, power: {} },
  onMoveSummonHere: 'ogs-recruit-token',
});

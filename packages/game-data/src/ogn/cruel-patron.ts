import { defineUnit } from '../unit-definition.js';
/** OGN-208 : coût supplémentaire obligatoire, tuer une unité alliée. */
export const cruelPatron = defineUnit({
  id: 'ogn-208-298',
  name: 'Cruel Patron',
  type: 'unit',
  might: 6,
  cost: { energy: 4, power: {} },
  sacrificeCost: true,
  text: 'As an additional cost to play me, kill a friendly unit.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/c1c2c08fa0032a245c1ffee6ba29fff2826bd468-744x1039.png?accountingTag=RB',
});

import { defineUnit } from '../unit-definition.js';
/** OGN-109 : +1 Might par carte de son cimetière ; au début de sa Beginning, recycle 3
 * cartes de son cimetière. */
export const drMundo = defineUnit({
  id: 'ogn-109-298',
  name: 'Dr. Mundo',
  type: 'unit',
  cost: { energy: 8, power: { bleu: 2 } },
  might: 6,
  mightPerTrashCard: 1,
  recycleTrashAtBeginning: 3,
  text: 'My Might is increased by the number of cards in your trash.\nAt the start of your Beginning Phase, recycle 3 from your trash.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/cf51fe8bedf5139e8cc1fc062969949ea7b121f0-744x1039.png?accountingTag=RB',
});

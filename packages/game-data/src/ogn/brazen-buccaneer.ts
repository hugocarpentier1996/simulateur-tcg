import { defineUnit } from '../unit-definition.js';
/** OGN-002 : coût supplémentaire facultatif, défausser 1 carte, pour 2 énergie de moins. */
export const brazenBuccaneer = defineUnit({
  id: 'ogn-002-298',
  name: 'Brazen Buccaneer',
  type: 'unit',
  might: 5,
  cost: { energy: 6, power: {} },
  discardDiscount: 2,
  text: 'As you play me, you may discard 1 as an additional cost. If you do, reduce my cost by {energy:2}.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/d481971f7560e7235e7d6934767da18daa019eff-744x1039.png?accountingTag=RB',
});

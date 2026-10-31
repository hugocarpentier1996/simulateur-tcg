import { defineUnit } from '../unit-definition.js';
/** OGN-028 : sa Might augmente du nombre de points de son propriétaire. */
export const draven = defineUnit({
  id: 'ogn-028-298',
  name: 'Draven',
  type: 'unit',
  cost: { energy: 5, power: { rouge: 1 } },
  might: 3,
  mightPerOwnPoint: 1,
  text: 'My Might is increased by your points.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/7600d6cea66e8146ea2202f72cb9035cb44608a3-744x1039.png?accountingTag=RB',
});

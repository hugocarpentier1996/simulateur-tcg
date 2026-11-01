import { defineUnit } from '../unit-definition.js';
/** OGN-236 : les effets Deathknell de son propriétaire se déclenchent une fois de plus. */
export const karthus = defineUnit({
  id: 'ogn-236-298',
  name: 'Karthus',
  type: 'unit',
  might: 3,
  cost: { energy: 3, power: { jaune: 1 } },
  doubleDeathknell: true,
  text: 'Your [Deathknell] effects trigger an additional time.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/df3497ce6a602da554813340f572240675c7f0e2-744x1039.png?accountingTag=RB',
});

import { defineGear } from '../gear-definition.js';
/** OGN-060 : une unité alliée qui attaque ou défend seule a +1 Might. */
export const maskOfForesight = defineGear({
  id: 'ogn-060-298',
  name: 'Mask of Foresight',
  type: 'gear',
  cost: { energy: 2, power: {} },
  effects: [{ type: 'might-bonus', scope: 'alone-in-combat', amount: 1 }],
  text: 'When a friendly unit attacks or defends alone, give it +1 {might} this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/03824709acbb4151d13b083a842c4702a3e61221-744x1039.png?accountingTag=RB',
});

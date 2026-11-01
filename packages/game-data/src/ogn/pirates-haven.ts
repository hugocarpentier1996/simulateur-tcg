import { defineGear } from '../gear-definition.js';
/** OGN-143 : quand son propriétaire redresse une unité alliée, elle gagne +1 Might ce tour. */
export const piratesHaven = defineGear({
  id: 'ogn-143-298',
  name: "Pirate's Haven",
  type: 'gear',
  cost: { energy: 3, power: {} },
  effects: [],
  mightOnAllyReadied: 1,
  text: 'When you ready a friendly unit, give it +1 {might} this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/1991b64d58cbd3698574f44b404f7a88d6403134-744x1039.png?accountingTag=RB',
});

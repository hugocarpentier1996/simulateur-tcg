import { defineUnit } from '../unit-definition.js';
/** OGN-240 : Tank ; +1 Might par unité alliée buffée de son champ. */
export const settOrder = defineUnit({
  id: 'ogn-240-298',
  name: 'Sett',
  type: 'unit',
  cost: { energy: 4, power: { jaune: 1 } },
  might: 5,
  tank: true,
  mightPerBuffedAllyHere: 1,
  text: '[Tank] (I must be assigned combat damage first.)\nI get +1 {might} for each buffed friendly unit at my battlefield.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/bd43f1dcef824b66f1af994b59b961fc3705f9c3-744x1039.png?accountingTag=RB',
});

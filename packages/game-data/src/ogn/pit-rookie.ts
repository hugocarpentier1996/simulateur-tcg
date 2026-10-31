import { defineUnit } from '../unit-definition.js';
/** OGN-136 : à la mise en jeu, buffe une autre unité alliée. */
export const pitRookie = defineUnit({
  id: 'ogn-136-298',
  name: 'Pit Rookie',
  type: 'unit',
  cost: { energy: 2, power: {} },
  might: 2,
  onPlayTargetEffect: {
    allegiance: 'friendly',
    excludeSelf: true,
    effect: { type: 'buff' },
  },
  text: "When you play me, buff another friendly unit. (If it doesn't have a buff, it gets a +1 {might} buff.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/ec19eeaee85c7e5669387a3f6ccb7718f5a0f570-744x1039.png?accountingTag=RB',
});

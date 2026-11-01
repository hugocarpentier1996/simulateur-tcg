import { defineUnit } from '../unit-definition.js';
/** OGN-162 : Accelerate ; Ganking ; la première fois qu'elle se déplace chaque tour, son
 * propriétaire peut redresser autre chose de Tap (unité, gear, légende ou rune). */
export const missFortuneBody = defineUnit({
  id: 'ogn-162-298',
  name: 'Miss Fortune',
  type: 'unit',
  might: 5,
  cost: { energy: 5, power: { orange: 1 } },
  accelerate: { power: 'orange' },
  ganking: true,
  onFirstMoveReadyOther: true,
  text: "[Accelerate] (You may pay {energy:1}{power:body} as an additional cost to have me enter ready.)\n[Ganking] (I can move from battlefield to battlefield.)\nThe first time I move each turn, you may ready something else that's exhausted.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/3c7b219245cd6c6ee835974dd74771bc605289de-744x1039.png?accountingTag=RB',
});

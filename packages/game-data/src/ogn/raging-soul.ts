import { defineUnit } from '../unit-definition.js';
/** OGN-019 : si son propriétaire a défaussé une carte ce tour, Assault et Ganking. */
export const ragingSoul = defineUnit({
  id: 'ogn-019-298',
  name: 'Raging Soul',
  type: 'unit',
  cost: { energy: 4, power: {} },
  might: 4,
  ifDiscardedThisTurn: { assault: 1, ganking: true },
  text: "If you've discarded a card this turn, I have [Assault] and [Ganking]. (+1 {might} while I'm an attacker. I can move from battlefield to battlefield.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/037647d0decc94ff4a5d53b11cf36afe9d849533-744x1039.png?accountingTag=RB',
});

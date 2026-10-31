import { defineUnit } from '../unit-definition.js';
/** OGN-027 : quand son propriétaire joue sa deuxième carte du tour, +2 Might ce tour et
 * se redresse. */
export const dariusFury = defineUnit({
  id: 'ogn-027-298',
  name: 'Darius',
  type: 'unit',
  cost: { energy: 5, power: { rouge: 1 } },
  might: 5,
  onSecondCardPlayed: { might: 2, ready: true },
  text: 'When you play your second card in a turn, give me +2 {might} this turn and ready me.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/bf7a4900fd2296972c1305a4707c23860bb0522e-744x1039.png?accountingTag=RB',
});

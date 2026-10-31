import { defineUnit } from '../unit-definition.js';
/** OGN-238 : Shield ; en attaquant, Stun d'une unité ennemie de ce champ. */
export const leonaOrder = defineUnit({
  id: 'ogn-238-298',
  name: 'Leona',
  type: 'unit',
  cost: { energy: 4, power: { jaune: 1 } },
  might: 4,
  shield: 1,
  onAttackTargetEffect: { type: 'stun' },
  text: "[Shield] (+1 {might} while I'm a defender.)\nWhen I attack, stun an enemy unit here. (It doesn't deal combat damage this turn.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/39a1e121031cfb4bdb009b071ed5d70411966cd9-744x1039.png?accountingTag=RB',
});

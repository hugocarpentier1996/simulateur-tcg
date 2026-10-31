import { defineUnit } from '../unit-definition.js';
/** OGN-003 : Assault 2 ; à la mise en jeu, défausse 1. */
export const chemtechEnforcer = defineUnit({
  id: 'ogn-003-298',
  name: 'Chemtech Enforcer',
  type: 'unit',
  cost: { energy: 2, power: {} },
  might: 2,
  assault: 2,
  onPlayEffect: { type: 'discard', count: 1 },
  text: "[Assault 2] (+2 {might} while I'm an attacker.)\nWhen you play me, discard 1.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/19dcf211457d9c9c6e9ea0cd32af76c2c92a3160-744x1039.png?accountingTag=RB',
});

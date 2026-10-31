import { defineUnit } from '../unit-definition.js';
/** OGN-030 : Accelerate (Fury), Assault 2 ; à la mise en jeu, défausse 2. */
export const jinx = defineUnit({
  id: 'ogn-030-298',
  name: 'Jinx',
  type: 'unit',
  cost: { energy: 3, power: { rouge: 1 } },
  might: 4,
  accelerate: { power: 'rouge' },
  assault: 2,
  onPlayEffect: { type: 'discard', count: 2 },
  text: "[Accelerate] (You may pay {energy:1}{power:fury} as an additional cost to have me enter ready.)\n[Assault 2] (+2 {might} while I'm an attacker.)\nWhen you play me, discard 2.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/d6cac988aa7798945e550eba6841d3993868c4a4-744x1039.png?accountingTag=RB',
});

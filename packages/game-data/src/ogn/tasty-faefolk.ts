import { defineUnit } from '../unit-definition.js';
/** OGN-075 : Accelerate (Calm) ; Deathknell — canalise 2 runes Tap et pioche 1. */
export const tastyFaefolk = defineUnit({
  id: 'ogn-075-298',
  name: 'Tasty Faefolk',
  type: 'unit',
  cost: { energy: 7, power: {} },
  might: 6,
  accelerate: { power: 'vert' },
  onDeath: { type: 'channel-exhausted', count: 2, draw: 1 },
  text: '[Accelerate] (You may pay {energy:1}{power:calm} as an additional cost to have me enter ready.)\n[Deathknell] — Channel 2 runes exhausted and draw 1. (When I die, get the effect.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/65f69ca9a1087deb12e91fb6fdee7b6efd0c088f-744x1039.png?accountingTag=RB',
});

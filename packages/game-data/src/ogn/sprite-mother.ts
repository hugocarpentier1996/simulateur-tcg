import { defineUnit } from '../unit-definition.js';
/** Jeton Sprite : 3 Might, entre Ready, Temporary. Sans illustration locale. */
export const spriteToken = defineUnit({
  id: 'token-sprite',
  name: 'Sprite',
  type: 'unit',
  cost: { energy: 0, power: {} },
  might: 3,
  entersReady: true,
  temporary: true,
});
/** OGN-106 : à la mise en jeu, joue ici un jeton Sprite 3 Ready et Temporary. */
export const spriteMother = defineUnit({
  id: 'ogn-106-298',
  name: 'Sprite Mother',
  type: 'unit',
  cost: { energy: 4, power: { bleu: 1 } },
  might: 3,
  onPlaySummonHere: 'token-sprite',
  text: "When you play me, play a ready 3 {might} Sprite unit token with [Temporary] here. (Kill it at the start of its controller's Beginning Phase, before scoring.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/65c06528f88de1ac207b382d4830ccfdd08a2d12-744x1039.png?accountingTag=RB',
});

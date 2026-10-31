import { defineUnit } from '../unit-definition.js';
/** OGN-218 : Legion — à la mise en jeu, joue ici deux jetons Recrue 1. */
export const vanguardCaptain = defineUnit({
  id: 'ogn-218-298',
  name: 'Vanguard Captain',
  type: 'unit',
  cost: { energy: 3, power: { jaune: 1 } },
  might: 3,
  onPlaySummonHere: 'ogs-recruit-token',
  onPlaySummonHereCount: 2,
  onPlaySummonHereLegion: true,
  text: "[Legion] — When you play me, play two 1 {might} Recruit unit tokens here. (Get the effect if you've played another card this turn.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/f0c9ddb2af7a0d4991938cf1e3058eb0f5d2e357-744x1039.png?accountingTag=RB',
});

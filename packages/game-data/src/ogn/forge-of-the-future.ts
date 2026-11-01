import { defineGear } from '../gear-definition.js';
/** OGN-212 : posé, joue un jeton Recrue 1 dans sa base ; le détruire : recycle jusqu'à 4
 * cartes des cimetières (choisies une à une). */
export const forgeOfTheFuture = defineGear({
  id: 'ogn-212-298',
  name: 'Forge of the Future',
  type: 'gear',
  cost: { energy: 2, power: {} },
  effects: [],
  onPlaySummonBase: 'ogs-recruit-token',
  tapAbility: {
    noExhaust: true,
    killSelfCost: true,
    target: {},
    effect: { type: 'recycle-trashes', count: 4 },
  },
  text: 'When you play this, play a 1 {might} Recruit unit token at your base.\nKill this: Recycle up to 4 cards from trashes.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/8e6a76d28590bcd835b0a9a1e806fe0fa6883141-744x1039.png?accountingTag=RB',
});

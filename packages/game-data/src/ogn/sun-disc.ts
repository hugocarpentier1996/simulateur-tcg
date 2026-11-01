import { defineGear } from '../gear-definition.js';
/** OGN-021 : Tap — Legion : la prochaine unité jouée ce tour arrive Ready. */
export const sunDisc = defineGear({
  id: 'ogn-021-298',
  name: 'Sun Disc',
  type: 'gear',
  cost: { energy: 2, power: { rouge: 1 } },
  effects: [],
  tapAbility: { target: {}, effect: { type: 'next-unit-ready', legion: true } },
  text: "{exhaust}: [Legion] — The next unit you play this turn enters ready. (Get the effect if you've played another card this turn.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/146d7514f15e6674f471f3aa9c3fadf22c0b634b-744x1039.png?accountingTag=RB',
});

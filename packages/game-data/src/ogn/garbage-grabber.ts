import { defineGear } from '../gear-definition.js';
/** OGN-099 : recycler 3 cartes de son cimetière, 1 énergie, Tap : pioche 1. */
export const garbageGrabber = defineGear({
  id: 'ogn-099-298',
  name: 'Garbage Grabber',
  type: 'gear',
  cost: { energy: 2, power: {} },
  effects: [],
  tapAbility: {
    cost: { energy: 1, power: {} },
    recycleTrash: 3,
    target: {},
    effect: { type: 'draw', count: 1 },
  },
  text: 'Recycle 3 from your trash, {energy:1}, {exhaust}: Draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/199f21237aeee2582904463a15ec62ce29452c10-744x1039.png?accountingTag=RB',
});

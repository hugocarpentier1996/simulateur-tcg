import { defineGear } from '../gear-definition.js';
/** OGN-181 : Tap — renvoie dans la main de son propriétaire un autre gear, une unité ou une
 * carte cachée alliés. */
export const packOfWonders = defineGear({
  id: 'ogn-181-298',
  name: 'Pack of Wonders',
  type: 'gear',
  cost: { energy: 2, power: {} },
  effects: [],
  tapAbility: {
    target: { allegiance: 'friendly' },
    effect: { type: 'bounce-friendly' },
  },
  text: "{exhaust}: Return another friendly gear, unit, or [Hidden] card to its owner's hand.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/a0830f326c49abe7fb1d3c9787e7ce5d7b776eec-744x1039.png?accountingTag=RB',
});

import { defineGear } from '../gear-definition.js';
/** OGN-242 : 1 énergie, 1 Power Order, Tap : tue une unité alliée ; regarde les 5 cartes du
 * dessus et peut jouer gratuitement une unité de Might au plus 1 de plus ; recycle le reste. */
export const baitedHook = defineGear({
  id: 'ogn-242-298',
  name: 'Baited Hook',
  type: 'gear',
  cost: { energy: 3, power: {} },
  effects: [],
  tapAbility: {
    cost: { energy: 1, power: { jaune: 1 } },
    target: { allegiance: 'friendly' },
    effect: { type: 'hook', count: 5 },
  },
  text: '{energy:1}{power:order}, {exhaust}: Kill a friendly unit. Look at the top 5 cards of your Main Deck. You may banish a unit from among them that has Might up to 1 more than the killed unit and play it, ignoring its cost. Then recycle the rest.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/7b4e6a1e32878a7d5fe4e40869c83e47ea08de7c-744x1039.png?accountingTag=RB',
});

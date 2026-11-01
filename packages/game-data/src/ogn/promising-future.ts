import { defineSpell } from '../spell-definition.js';
/** OGN-115 : chaque joueur regarde les 5 cartes du dessus, en choisit une et recycle le reste ;
 * en commençant par le joueur suivant, chacun joue sa carte sans payer l'énergie. */
export const promisingFuture = defineSpell({
  id: 'ogn-115-298',
  name: 'Promising Future',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 5, power: { bleu: 1 } },
  target: { kind: 'caster' },
  effects: [{ type: 'promising-future' }],
  text: 'Each player looks at the top 5 cards of their Main Deck, chooses one, then recycles the rest. Starting with the next player, each player plays those cards, ignoring Energy costs. (They must still pay Power costs.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/1ea5e7e50aaecee0b2ee2657d3c829dff0718fba-744x1039.png?accountingTag=RB',
});

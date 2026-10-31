import { defineUnit } from '../unit-definition.js';
/** OGN-020 : Legion — à la mise en jeu, défausse 2 puis pioche 2. */
export const scrapyardChampion = defineUnit({
  id: 'ogn-020-298',
  name: 'Scrapyard Champion',
  type: 'unit',
  cost: { energy: 5, power: { rouge: 1 } },
  might: 5,
  onPlayEffect: { type: 'discard', count: 2, draw: 2, legion: true },
  text: "[Legion] — When you play me, discard 2, then draw 2. (Get the effect if you've played another card this turn.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/10f096d2b469fd73329386e5efe88c9bec667d7c-744x1039.png?accountingTag=RB',
});

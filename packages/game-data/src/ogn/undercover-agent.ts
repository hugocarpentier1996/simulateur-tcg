import { defineUnit } from '../unit-definition.js';
/** OGN-178 : Deathknell — défausse 2, puis pioche 2. */
export const undercoverAgent = defineUnit({
  id: 'ogn-178-298',
  name: 'Undercover Agent',
  type: 'unit',
  cost: { energy: 5, power: { violet: 1 } },
  might: 5,
  onDeath: { type: 'discard-draw', discard: 2, draw: 2 },
  text: '[Deathknell] — Discard 2, then draw 2. (When I die, get the effect.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/3e4e318c0cc97b13646ee454da71046a09236e47-744x1039.png?accountingTag=RB',
});

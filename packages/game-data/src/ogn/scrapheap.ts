import { defineGear } from '../gear-definition.js';
/** OGN-182 : quand il est posé, défaussé ou détruit, son propriétaire pioche 1. */
export const scrapheap = defineGear({
  id: 'ogn-182-298',
  name: 'Scrapheap',
  type: 'gear',
  cost: { energy: 2, power: {} },
  effects: [],
  drawOnPlayDiscardOrKill: true,
  text: 'When this is played, discarded, or killed, draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/0c059786e89a2443221b7c0b8ca39779dcc9c755-744x1038.png?accountingTag=RB',
});

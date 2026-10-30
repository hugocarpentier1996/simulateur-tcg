import { defineSpell } from '../spell-definition.js';
/** OGN-138 : canalise 2 runes Tap ; pioche 1 si les 2 n'ont pas pu être canalisées. */
export const catalystOfAeons = defineSpell({
  id: 'ogn-138-298',
  name: 'Catalyst of Aeons',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 4, power: {} },
  target: { kind: 'caster' },
  effects: [{ type: 'channel-exhausted', count: 2, drawIfShort: true }],
  text: "Channel 2 runes exhausted. If you couldn't channel 2 runes this way, draw 1.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/4753707323ab6f9ac572c097f29f2f76ac62f54f-744x1039.png?accountingTag=RB',
});

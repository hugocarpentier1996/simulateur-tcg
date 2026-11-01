import { defineUnit } from '../unit-definition.js';
/** OGN-155 : Deflect ; à la conquête, pioche 1 ou canalise 1 rune Tap (au choix). */
export const qiyana = defineUnit({
  id: 'ogn-155-298',
  name: 'Qiyana',
  type: 'unit',
  might: 4,
  cost: { energy: 4, power: { orange: 1 } },
  deflect: true,
  onConquerChoice: ['draw', 'channel-exhausted'],
  text: '[Deflect] (Opponents must pay {power:any} to choose me with a spell or ability.)\nWhen I conquer, draw 1 or channel 1 rune exhausted.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/90d1a07ef0c6c8282e6eee77e479254f50752eb2-744x1039.png?accountingTag=RB',
});

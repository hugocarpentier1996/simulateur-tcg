import { defineGear } from '../gear-definition.js';
/** OGN-152 : quand son propriétaire buffe une unité alliée, il peut payer 1 Power Body et
 * coucher ce gear pour la redresser (accepté automatiquement si possible, hypothèse). */
export const mistfall = defineGear({
  id: 'ogn-152-298',
  name: 'Mistfall',
  type: 'gear',
  cost: { energy: 3, power: {} },
  effects: [],
  readyOnAllyBuffed: { power: 'orange' },
  text: 'When you buff a friendly unit, you may pay {power:body} and exhaust this to ready it.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/1cedf0dcd6c4a44ae867e9f04f9f179d9b91c357-744x1039.png?accountingTag=RB',
});

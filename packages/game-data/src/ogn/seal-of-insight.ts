import { defineGear } from '../gear-definition.js';
/** OGN-120 : Tap — Réaction, ajoute 1 Power Mind (capacité ADD, sans pile). */
export const sealOfInsight = defineGear({
  id: 'ogn-120-298',
  name: 'Seal of Insight',
  type: 'gear',
  cost: { energy: 0, power: { bleu: 1 } },
  effects: [],
  resourceAbility: { power: 'bleu' },
  text: "{exhaust}: [Reaction] — [Add] {power:mind}. (Abilities that add resources can't be reacted to.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/9ee0dc0221f83d569e0f458374e40f7238f306c2-744x1039.png?accountingTag=RB',
});

import { defineUnit } from '../unit-definition.js';
/** OGN-112 : Ganking ; à la conquête, peut rejouer un sort de son cimetière d'énergie inférieure
 * à ses points, sans payer son énergie (Power payé), puis le recycler (sorts sans cible
 * individuelle seulement, hypothèse). */
export const kaiSaMind = defineUnit({
  id: 'ogn-112-298',
  name: "Kai'Sa",
  type: 'unit',
  might: 6,
  cost: { energy: 6, power: { bleu: 1 } },
  ganking: true,
  onConquerReplaySpell: true,
  text: '[Ganking] (I can move from battlefield to battlefield.)\nWhen I conquer, you may play a spell from your trash with Energy cost less than your points without paying its Energy cost. Then recycle it. (You must still pay its Power cost.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/fc4ee60eaedd5c56a9222fd07482b6a86b11baa4-744x1039.png?accountingTag=RB',
});

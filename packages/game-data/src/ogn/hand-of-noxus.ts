import { defineLegend } from '../legend-definition.js';
/** OGN-253 : Tap — Réaction, Legion : ajoute 1 énergie (capacité ADD, sans pile). */
export const handOfNoxus = defineLegend({
  id: 'ogn-253-298',
  name: 'Hand of Noxus',
  type: 'legend',
  colors: ['rouge', 'jaune'],
  resourceAbility: { energy: 1, legion: true },
  text: "{exhaust}: [Reaction], [Legion] — [Add] {energy:1}. (Abilities that add resources can't be reacted to. Get the effect if you've played a card this turn.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/5b9a904048b7fb936377844ec2d31564b7fedf81-744x1039.png?accountingTag=RB',
});

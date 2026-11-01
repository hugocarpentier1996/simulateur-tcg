import { defineLegend } from '../legend-definition.js';
/** OGN-247 : Tap — Réaction, ajoute 1 Power de n'importe quel domaine, utilisable seulement
 * pour jouer des sorts (capacité ADD, sans pile). */
export const daughterOfTheVoid = defineLegend({
  id: 'ogn-247-298',
  name: 'Daughter of the Void',
  type: 'legend',
  colors: ['rouge', 'bleu'],
  resourceAbility: { spellPower: 1 },
  text: "{exhaust}: [Reaction] — [Add] {power:any}. Use only to play spells. (Abilities that add resources can't be reacted to.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/3ea826277086945a2cdfda4e41b771075aa8b15b-744x1039.png?accountingTag=RB',
});

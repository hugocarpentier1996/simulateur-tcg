import { defineUnit } from '../unit-definition.js';
/** OGN-097 : Hidden ; à la mise en jeu, -2 Might à une unité jusqu'à la fin du tour (minimum 1). */
export const blastconeFae = defineUnit({
  id: 'ogn-097-298',
  name: 'Blastcone Fae',
  type: 'unit',
  might: 2,
  cost: { energy: 2, power: { bleu: 1 } },
  hidden: true,
  onPlayTargetEffect: {
    effect: { type: 'modify-might', amount: -2, minimum: 1 },
  },
  text: '[Hidden] (Hide now for {power:any} to react with later for {energy:0}.)\nWhen you play me, give a unit -2 {might} this turn, to a minimum of 1 {might}.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/fac53b2216490c99ad7ce11dc5e663a692d6c104-744x1039.png?accountingTag=RB',
});

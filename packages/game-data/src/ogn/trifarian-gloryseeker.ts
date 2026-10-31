import { defineUnit } from '../unit-definition.js';
/** OGN-217 : Legion — à la mise en jeu, se buffe. */
export const trifarianGloryseeker = defineUnit({
  id: 'ogn-217-298',
  name: 'Trifarian Gloryseeker',
  type: 'unit',
  cost: { energy: 2, power: {} },
  might: 2,
  onPlayEffect: { type: 'buff-self', legion: true },
  text: "[Legion] — When you play me, buff me. (If I don't have a buff, I get a +1 {might} buff. Get the effect if you've played another card this turn.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/19ad6a0e743b56021b9651a2105034a488e172e8-744x1039.png?accountingTag=RB',
});

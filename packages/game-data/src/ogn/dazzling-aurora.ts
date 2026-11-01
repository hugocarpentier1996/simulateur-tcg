import { defineGear } from '../gear-definition.js';
/** OGN-160 : à la fin du tour de son propriétaire, révèle des cartes du dessus jusqu'à une
 * unité, la joue gratuitement (dans sa base, Tap) et recycle le reste. */
export const dazzlingAurora = defineGear({
  id: 'ogn-160-298',
  name: 'Dazzling Aurora',
  type: 'gear',
  cost: { energy: 9, power: { orange: 2 } },
  effects: [],
  endTurnRevealUnit: true,
  text: 'At the end of your turn, reveal cards from the top of your Main Deck until you reveal a unit. Play it, ignoring its cost, and recycle the rest.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/c023856a50c75058465f283d181277ce265ba108-744x1039.png?accountingTag=RB',
});

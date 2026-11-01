import { defineGear } from '../gear-definition.js';
/** OGN-228 : quand une unité alliée buffée meurt, une autre unité alliée est buffée
 * (choix automatique d'une unité sans buff, hypothèse ; sans pile). */
export const vanguardHelm = defineGear({
  id: 'ogn-228-298',
  name: 'Vanguard Helm',
  type: 'gear',
  cost: { energy: 2, power: {} },
  effects: [],
  buffOnBuffedAllyDeath: true,
  text: "When a buffed friendly unit dies, buff another friendly unit. (If it doesn't have a buff, it gets a +1 {might} buff.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/9718c666cbf789a572760c826d0a06b26b787ae5-744x1039.png?accountingTag=RB',
});

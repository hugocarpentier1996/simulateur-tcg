import { defineUnit } from '../unit-definition.js';
/** OGN-200 : en attaquant, révèle la rune du dessus de son deck de runes puis la recycle ;
 * Fury : 2 dégâts à un ennemi ici et 1 aux autres ennemis ici ; Mind : pioche 1 ;
 * Order : étourdit une unité ennemie. */
export const twistedFate = defineUnit({
  id: 'ogn-200-298',
  name: 'Twisted Fate',
  type: 'unit',
  might: 4,
  cost: { energy: 4, power: {} },
  onAttackRuneFate: true,
  text: 'When I attack, reveal the top rune of your rune deck, then recycle it. Do one of the following based on its domain:{power:fury} — Deal 2 to an enemy unit here and 1 to all other enemy units here.{power:mind} — Draw 1.{power:order} — Stun an enemy unit.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/9eff1a038528c4d633196f13259670d84b74c2a8-744x1039.png?accountingTag=RB',
});

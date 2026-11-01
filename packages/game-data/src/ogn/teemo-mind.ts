import { defineUnit } from '../unit-definition.js';
/** OGN-121 : Hidden ; quand il défend ou est joué depuis Hidden, révèle les 5 cartes du
 * dessus : 1 dégât à un ennemi ici par carte Hidden révélée, puis les recycle. */
export const teemoMind = defineUnit({
  id: 'ogn-121-298',
  name: 'Teemo',
  type: 'unit',
  might: 2,
  cost: { energy: 2, power: { bleu: 1 } },
  hidden: true,
  hiddenRevealDamage: 5,
  text: "[Hidden] (Hide now for {power:any} to react with later for {energy:0}.)\nWhen I defend or I'm played from [Hidden], reveal the top 5 cards of your Main Deck. Deal 1 to an enemy unit here for each card with [Hidden], then recycle them.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/b05f31bf744972983f61a9f5801b4ffd68fb9ebf-744x1039.png?accountingTag=RB',
});

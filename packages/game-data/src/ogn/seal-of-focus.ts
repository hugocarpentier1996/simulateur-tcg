import { defineGear } from '../gear-definition.js';
/** OGN-081 : Tap — Réaction, ajoute 1 Power Calm (capacité ADD, sans pile). */
export const sealOfFocus = defineGear({
  id: 'ogn-081-298',
  name: 'Seal of Focus',
  type: 'gear',
  cost: { energy: 0, power: { vert: 1 } },
  effects: [],
  resourceAbility: { power: 'vert' },
  text: "{exhaust}: [Reaction] — [Add] {power:calm}. (Abilities that add resources can't be reacted to.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/288c300c4e4cb10ecfe6c3cbb543d0636b306852-744x1039.png?accountingTag=RB',
});

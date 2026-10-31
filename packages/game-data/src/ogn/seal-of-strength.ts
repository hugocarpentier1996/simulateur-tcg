import { defineGear } from '../gear-definition.js';
/** OGN-163 : Tap — Réaction, ajoute 1 Power Body (capacité ADD, sans pile). */
export const sealOfStrength = defineGear({
  id: 'ogn-163-298',
  name: 'Seal of Strength',
  type: 'gear',
  cost: { energy: 0, power: { orange: 1 } },
  effects: [],
  resourceAbility: { power: 'orange' },
  text: "{exhaust}: [Reaction] — [Add] {power:body}. (Abilities that add resources can't be reacted to.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/415644b2798348e3d7198ec900cc40aaa4eb8bdf-744x1039.png?accountingTag=RB',
});

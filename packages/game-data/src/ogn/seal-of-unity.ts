import { defineGear } from '../gear-definition.js';
/** OGN-245 : Tap — Réaction, ajoute 1 Power Order (capacité ADD, sans pile). */
export const sealOfUnity = defineGear({
  id: 'ogn-245-298',
  name: 'Seal of Unity',
  type: 'gear',
  cost: { energy: 0, power: { jaune: 1 } },
  effects: [],
  resourceAbility: { power: 'jaune' },
  text: "{exhaust}: [Reaction] — [Add] {power:order}. (Abilities that add resources can't be reacted to.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/e6fbd41d69bc0d235ea7993d2e9fa74e75e17dff-744x1039.png?accountingTag=RB',
});

import { defineGear } from '../gear-definition.js';
/** OGN-098 : Tap — Réaction, ajoute 1 énergie (capacité ADD, sans pile). */
export const energyConduit = defineGear({
  id: 'ogn-098-298',
  name: 'Energy Conduit',
  type: 'gear',
  cost: { energy: 3, power: {} },
  effects: [],
  resourceAbility: { energy: 1 },
  text: "{exhaust}: [Reaction] — [Add] {energy:1}. (Abilities that add resources can't be reacted to.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/f0e0a67e9e9b1d45d12d248df78b4e643b70bdc1-744x1039.png?accountingTag=RB',
});

import { defineGear } from '../gear-definition.js';
/** OGN-204 : Tap — Réaction, ajoute 1 Power Chaos (capacité ADD, sans pile). */
export const sealOfDiscord = defineGear({
  id: 'ogn-204-298',
  name: 'Seal of Discord',
  type: 'gear',
  cost: { energy: 0, power: { violet: 1 } },
  effects: [],
  resourceAbility: { power: 'violet' },
  text: "{exhaust}: [Reaction] — [Add] {power:chaos}. (Abilities that add resources can't be reacted to.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/dd8433e77e46ca77aaf0be35d1774218d9a2f037-744x1039.png?accountingTag=RB',
});

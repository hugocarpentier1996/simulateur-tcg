import { defineGear } from '../gear-definition.js';
/** OGN-040 : Tap — Réaction, ajoute 1 Power Fury (capacité ADD, sans pile). */
export const sealOfRage = defineGear({
  id: 'ogn-040-298',
  name: 'Seal of Rage',
  type: 'gear',
  cost: { energy: 0, power: { rouge: 1 } },
  effects: [],
  resourceAbility: { power: 'rouge' },
  text: "{exhaust}: [Reaction] — [Add] {power:fury}. (Abilities that add resources can't be reacted to.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/fbdd14adb40b0ca46b89f476a356fa21413d812e-744x1039.png?accountingTag=RB',
});

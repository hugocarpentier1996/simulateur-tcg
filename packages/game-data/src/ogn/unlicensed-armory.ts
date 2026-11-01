import { defineGear } from '../gear-definition.js';
/** OGN-023 : défausser 1, Tap : une unité alliée choisie, la prochaine fois qu'elle devrait
 * mourir ce tour, peut être rappelée Tap en payant 1 Power Fury (accepté si payable). */
export const unlicensedArmory = defineGear({
  id: 'ogn-023-298',
  name: 'Unlicensed Armory',
  type: 'gear',
  cost: { energy: 2, power: {} },
  effects: [],
  tapAbility: {
    discardCost: true,
    target: { allegiance: 'friendly' },
    effect: { type: 'paid-recall', power: 'rouge' },
  },
  text: "Discard 1, {exhaust}: Choose a friendly unit. The next time it dies this turn, you may pay {power:fury} to recall it exhausted instead. (Send it to base. This isn't a move.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/1a80bedd893d9024fc90f108da36b4fd1d496ad6-744x1039.png?accountingTag=RB',
});

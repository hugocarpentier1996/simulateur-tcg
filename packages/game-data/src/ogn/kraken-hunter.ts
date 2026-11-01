import { defineUnit } from '../unit-definition.js';
/** OGN-150 : Accelerate ; Assault ; peut dépenser des buffs alliés en coût supplémentaire,
 * -1 Power Body chacun. */
export const krakenHunter = defineUnit({
  id: 'ogn-150-298',
  name: 'Kraken Hunter',
  type: 'unit',
  might: 5,
  cost: { energy: 3, power: { orange: 2 } },
  accelerate: { power: 'orange' },
  assault: 1,
  unitCostReduction: { kind: 'spend-buff', power: 'orange' },
  text: "[Accelerate] (You may pay {energy:1}{power:body} as an additional cost to have me enter ready.)\n[Assault] (+1 {might} while I'm an attacker.)\nAs you play me, you may spend any number of buffs as an additional cost. Reduce my cost by {power:body} for each buff you spend.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/51aab4710d000a9c1e665a37ef8c919ff11b0282-744x1039.png?accountingTag=RB',
});

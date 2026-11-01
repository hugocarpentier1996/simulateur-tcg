import { defineUnit } from '../unit-definition.js';
/** OGN-231 : peut tuer des unités alliées en coût supplémentaire, -1 Power Order chacune ;
 * Deflect ; Ganking. */
export const commanderLedros = defineUnit({
  id: 'ogn-231-298',
  name: 'Commander Ledros',
  type: 'unit',
  might: 8,
  cost: { energy: 6, power: { jaune: 4 } },
  deflect: true,
  ganking: true,
  unitCostReduction: { kind: 'sacrifice', power: 'jaune' },
  text: 'As you play me, you may kill any number of friendly units as an additional cost. Reduce my cost by {power:order} for each killed this way.\n[Deflect] (Opponents must pay {power:any} to choose me with a spell or ability.)\n[Ganking] (I can move from battlefield to battlefield.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/1183be5effc6275f17da09b983feb36632752af4-744x1039.png?accountingTag=RB',
});

import { defineSpell } from '../spell-definition.js';
/** OGN-053 : Hidden ; Action ; buffe une unité alliée ; ce tour, les buffs des unités
 * alliées donnent +1 Might supplémentaire. */
export const standUnited = defineSpell({
  id: 'ogn-053-298',
  name: 'Stand United',
  type: 'spell',
  timing: 'action',
  hidden: true,
  cost: { energy: 3, power: {} },
  target: { kind: 'unit', combatRole: 'any', allegiance: 'friendly' },
  effects: [{ type: 'buff-unit' }, { type: 'empower-buffs', amount: 1 }],
  text: "[Hidden] (Hide now for {power:any} to react with later for {energy:0}.)\n[Action] (Play on your turn or in showdowns.)\nBuff a friendly unit. Buffs give an additional +1 {might} to friendly units this turn. (To buff a unit, give it a +1 {might} buff if it doesn't already have one.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/4d10570e70a998de520d4baba254c3b726caa4f0-744x1039.png?accountingTag=RB',
});

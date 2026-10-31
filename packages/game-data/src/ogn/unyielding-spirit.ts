import { defineSpell } from '../spell-definition.js';
/** OGN-145 : Réaction ; empêche tous les dégâts de sort et de capacité ce tour. */
export const unyieldingSpirit = defineSpell({
  id: 'ogn-145-298',
  name: 'Unyielding Spirit',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 1, power: { orange: 1 } },
  target: { kind: 'caster' },
  effects: [{ type: 'prevent-effect-damage' }],
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nPrevent all spell and ability damage this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/9afea96ec04ce0c2ee76c4affbf4e6df470e7647-744x1039.png?accountingTag=RB',
});

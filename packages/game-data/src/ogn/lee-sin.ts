import { defineUnit } from '../unit-definition.js';
/** OGN-078 : Shield ; Tap : se buffe ; peut avoir un nombre quelconque de buffs. */
export const leeSin = defineUnit({
  id: 'ogn-078-298',
  name: 'Lee Sin',
  type: 'unit',
  might: 5,
  cost: { energy: 5, power: { vert: 1 } },
  shield: 1,
  unlimitedBuffs: true,
  tapAbility: { target: {}, effect: { type: 'buff-self' } },
  text: "[Shield] (+1 {might} while I'm a defender.)\n{exhaust}: Buff me. (I get a +1 {might} buff.)\nI can have any number of buffs.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/c6cc55639ad87cf9c8a74d6b3e5292d0b192c9b8-744x1039.png?accountingTag=RB',
});

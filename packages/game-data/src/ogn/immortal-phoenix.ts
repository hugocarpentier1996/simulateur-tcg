import { defineUnit } from '../unit-definition.js';
/** OGN-037 : Assault 2 ; quand un sort de son propriétaire tue une unité, il peut payer
 * 1 énergie et 1 Power Fury pour la jouer depuis son cimetière (dans sa base, Tap). */
export const immortalPhoenix = defineUnit({
  id: 'ogn-037-298',
  name: 'Immortal Phoenix',
  type: 'unit',
  might: 3,
  cost: { energy: 3, power: { rouge: 1 } },
  assault: 2,
  playOnSpellKill: { energy: 1, power: { rouge: 1 } },
  text: "[Assault 2] (+2 {might} while I'm an attacker.)\nWhen you kill a unit with a spell, you may pay {energy:1}{power:fury} to play me from your trash.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/7b623ae985bf5f362b6d8d4a17e9b8146aeae3c3-744x1039.png?accountingTag=RB',
});

import { defineSpell } from '../spell-definition.js';
/** OGN-033 : Réaction ; une unité ennemie subit 6, sauf si son contrôleur fait piocher 2 au lanceur. */
export const shakedown = defineSpell({
  id: 'ogn-033-298',
  name: 'Shakedown',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 2, power: { rouge: 1 } },
  target: { kind: 'unit', combatRole: 'any', allegiance: 'enemy' },
  effects: [{ type: 'damage-unless-draw', amount: 6, draw: 2 }],
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nChoose an enemy unit. Deal 6 to it unless its controller has you draw 2.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/ab71d92c94bf609e2fa6efc8fec06fe1e8b10108-744x1039.png?accountingTag=RB',
});

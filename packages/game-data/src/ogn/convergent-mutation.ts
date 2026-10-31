import { defineSpell } from '../spell-definition.js';
/** OGN-108 : Réaction ; ce tour, la Might d'une unité alliée est portée à celle d'une
 * autre unité alliée (secondaryTargetId), sans jamais la diminuer. */
export const convergentMutation = defineSpell({
  id: 'ogn-108-298',
  name: 'Convergent Mutation',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 2, power: { bleu: 1 } },
  target: { kind: 'unit', combatRole: 'any', allegiance: 'friendly' },
  effects: [{ type: 'match-ally-might' }],
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nChoose a friendly unit. This turn, increase its Might to the Might of another friendly unit.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/61d414fc67ff52b9082e282e628dd0916afd8454-744x1039.png?accountingTag=RB',
});

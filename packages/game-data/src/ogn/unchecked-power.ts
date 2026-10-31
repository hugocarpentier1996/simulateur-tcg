import { defineSpell } from '../spell-definition.js';
/** OGN-123 : épuise toutes les unités alliées, puis 12 dégâts à toutes les unités sur les champs. */
export const uncheckedPower = defineSpell({
  id: 'ogn-123-298',
  name: 'Unchecked Power',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 7, power: { bleu: 2 } },
  target: { kind: 'caster' },
  effects: [
    { type: 'exhaust-allies' },
    { type: 'damage-all-at-battlefields', amount: 12 },
  ],
  text: 'Exhaust all friendly units, then deal 12 to ALL units at battlefields.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/c44cd1f6f41144c770ac79f10e5ae75f0c6d6435-744x1039.png?accountingTag=RB',
});

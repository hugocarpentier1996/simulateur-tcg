import { defineSpell } from '../spell-definition.js';
/** OGN-156 : l'adversaire révèle sa main ; le lanceur y choisit une carte non-unité, recyclée. */
export const sabotage = defineSpell({
  id: 'ogn-156-298',
  name: 'Sabotage',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 1, power: { orange: 1 } },
  target: { kind: 'caster' },
  effects: [{ type: 'opponent-hand-pick', action: 'recycle-non-unit' }],
  text: 'Choose an opponent. They reveal their hand. Choose a non-unit card from it, and recycle that card.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/70f186b85fd224ee23dcf64957f0fab835d28040-744x1039.png?accountingTag=RB',
});

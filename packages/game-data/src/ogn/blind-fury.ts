import { defineSpell } from '../spell-definition.js';
/** OGN-025 : Action ; l'adversaire révèle le dessus de son deck ; la carte est bannie puis
 * jouée gratuitement par le lanceur (unité dans sa base sous son contrôle ; sort sans cible
 * individuelle lancé aussitôt ; sinon elle reste bannie, hypothèse). */
export const blindFury = defineSpell({
  id: 'ogn-025-298',
  name: 'Blind Fury',
  type: 'spell',
  timing: 'action',
  cost: { energy: 4, power: { rouge: 2 } },
  target: { kind: 'caster' },
  effects: [{ type: 'steal-top-card' }],
  text: '[Action] (Play on your turn or in showdowns.)\nEach opponent reveals the top card of their Main Deck. Choose one and banish it, then play it, ignoring its cost. Then recycle the rest.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/d74ba4998df9348408f1400090a0b0737c675fbd-744x1039.png?accountingTag=RB',
});

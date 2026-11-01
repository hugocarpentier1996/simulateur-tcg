import { defineUnit } from '../unit-definition.js';
/** OGN-192 : à la mise en jeu, l'adversaire révèle sa main ; son propriétaire y choisit une
 * carte, défaussée. */
export const mindsplitter = defineUnit({
  id: 'ogn-192-298',
  name: 'Mindsplitter',
  type: 'unit',
  might: 7,
  cost: { energy: 7, power: { violet: 2 } },
  onPlayEffect: { type: 'opponent-hand-pick', action: 'discard' },
  text: 'When you play me, choose an opponent. They reveal their hand. Choose a card from it, and they discard that card.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/8753058698cff6455da6cccd13a7fe901a164051-744x1039.png?accountingTag=RB',
});

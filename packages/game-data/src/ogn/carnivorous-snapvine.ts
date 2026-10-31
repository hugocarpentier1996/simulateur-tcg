import { defineUnit } from '../unit-definition.js';
/** OGN-149 : à la mise en jeu, elle et une unité ennemie sur un champ s'infligent leur Might. */
export const carnivorousSnapvine = defineUnit({
  id: 'ogn-149-298',
  name: 'Carnivorous Snapvine',
  type: 'unit',
  cost: { energy: 5, power: { orange: 2 } },
  might: 6,
  onPlayTargetEffect: {
    allegiance: 'enemy',
    zone: 'battlefield',
    effect: { type: 'fight' },
  },
  text: 'When you play me, choose an enemy unit at a battlefield. We deal damage equal to our Mights to each other.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/5ceaec3452d623931b5ac93d0af26b180b9646de-744x1039.png?accountingTag=RB',
});

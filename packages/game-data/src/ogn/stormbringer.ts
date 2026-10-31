import { defineSpell } from '../spell-definition.js';
/** OGN-250 : unité alliée en base ; dégâts égaux à sa Might à toutes les unités ennemies
 * d'un champ (destinationId), puis elle s'y déplace. */
export const stormbringer = defineSpell({
  id: 'ogn-250-298',
  name: 'Stormbringer',
  type: 'spell',
  timing: 'normal',
  cost: {
    energy: 6,
    power: {},
    powerChoice: ['rouge', 'orange'],
    powerChoiceAmount: 2,
  },
  target: {
    kind: 'unit',
    combatRole: 'any',
    zone: 'base',
    allegiance: 'friendly',
  },
  effects: [{ type: 'might-damage-enemies-then-move' }],
  text: 'Choose a friendly unit in your base. Deal damage equal to its Might to all enemy units at a battlefield, then move your unit there.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/d86c4137cc7f77f103cd7d6228125df8cb9a54e1-744x1039.png?accountingTag=RB',
});

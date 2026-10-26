import { defineSpell } from './spell-definition.js';

/** Quatre sorts pour les scénarios. Coûts et timings proposés pour couvrir les fenêtres,
 * sans prétention d'équilibrage ; couleurs provisoires comme celles des unités de test. */
export const testSpells = Object.freeze([
  defineSpell({
    id: 'test-reposition',
    name: 'Redéploiement',
    type: 'spell',
    timing: 'action',
    cost: { energy: 1, power: { 'color-1': 1 } },
    target: { kind: 'unit', combatRole: 'any' },
    effects: [{ type: 'move-unit', requiresReady: false, exhaustsUnit: false }],
  }),
  defineSpell({
    id: 'test-reinforce',
    name: 'Regain de force',
    type: 'spell',
    timing: 'reaction',
    cost: { energy: 1, power: { 'color-1': 1 } },
    target: { kind: 'unit', combatRole: 'any' },
    effects: [{ type: 'modify-might', amount: 2, duration: 'end-of-turn' }],
  }),
  defineSpell({
    id: 'test-weaken-draw',
    name: 'Affaiblissement lucide',
    type: 'spell',
    timing: 'normal',
    cost: { energy: 1, power: { 'color-2': 1 } },
    target: { kind: 'unit', combatRole: 'any' },
    effects: [
      { type: 'modify-might', amount: -1, duration: 'end-of-turn' },
      { type: 'draw', count: 1, player: 'caster' },
    ],
  }),
  defineSpell({
    id: 'test-stop-attacker',
    name: 'Brise-assaut',
    type: 'spell',
    timing: 'reaction',
    cost: { energy: 1, power: { 'color-2': 1 } },
    target: { kind: 'unit', combatRole: 'attacker' },
    effects: [{ type: 'stun', duration: 'end-of-turn' }],
  }),
]);

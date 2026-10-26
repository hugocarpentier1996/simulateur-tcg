import { defineUnit } from './unit-definition.js';

/** Première carte à capacité de mort et définition de son jeton. Coûts de test. */
export const deathTestUnits = Object.freeze([
  defineUnit({
    id: 'reborn',
    name: 'Gardien du dernier souffle',
    type: 'unit',
    cost: { energy: 1, power: {} },
    might: 1,
    onDeath: { type: 'summon-token', definitionId: 'spirit' },
  }),
  defineUnit({
    id: 'spirit',
    name: 'Esprit gardien (jeton)',
    type: 'unit',
    cost: { energy: 0, power: {} },
    might: 3,
  }),
]);

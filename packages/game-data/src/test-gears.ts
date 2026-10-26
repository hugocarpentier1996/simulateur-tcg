import { defineGear } from './gear-definition.js';

/** Cartes de démonstration, coûts provisoires non équilibrés. */
export const testGears = Object.freeze([
  defineGear({
    id: 'banner',
    name: 'Bannière de ralliement',
    type: 'gear',
    cost: { energy: 2, power: {} },
    effects: [{ type: 'might-bonus', scope: 'allied-units', amount: 1 }],
  }),
  defineGear({
    id: 'blade',
    name: 'Lame renforcée',
    type: 'gear',
    cost: { energy: 1, power: {} },
    equipCost: { energy: 1, power: { 'color-1': 1 } },
    effects: [{ type: 'might-bonus', scope: 'attached-unit', amount: 2 }],
  }),
]);

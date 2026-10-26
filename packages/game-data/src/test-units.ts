import { defineUnit } from './unit-definition.js';

/** Catalogue de test sans capacités : valeurs destinées aux scénarios, pas à l'équilibrage.
 * color-1 / color-2 sont des identifiants provisoires déjà utilisés par les runes de test. */
export const testUnits = Object.freeze([
  defineUnit({
    id: 'test-scout',
    name: 'Éclaireur de test',
    type: 'unit',
    cost: { energy: 1, power: { 'color-1': 1 } },
    might: 1,
  }),
  defineUnit({
    id: 'test-guard',
    name: 'Garde de test',
    type: 'unit',
    cost: { energy: 2, power: { 'color-2': 1 } },
    might: 3,
  }),
  defineUnit({
    id: 'test-colossus',
    name: 'Colosse de test',
    type: 'unit',
    cost: { energy: 4, power: { 'color-1': 2 } },
    might: 6,
  }),
  defineUnit({
    id: 'test-relic',
    name: 'Relique animée de test',
    type: 'unit',
    cost: { energy: 1, power: { 'color-2': 1 } },
    might: 0,
  }),
  defineUnit({
    id: 'test-dualist',
    name: 'Dualiste de test',
    type: 'unit',
    cost: { energy: 3, power: { 'color-1': 1, 'color-2': 1 } },
    might: 4,
  }),
]);

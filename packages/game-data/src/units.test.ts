import { describe, expect, it } from 'vitest';
import { defineUnit, testUnits } from './index.js';

describe('définitions des unités', () => {
  it('accepte Might 0 et conserve séparément énergie et Power par couleur', () => {
    const card = defineUnit({
      id: 'zero-might',
      name: 'Unité sans force',
      type: 'unit',
      cost: { energy: 2, power: { 'color-1': 1, 'color-2': 2 } },
      might: 0,
    });
    expect(card.might).toBe(0);
    expect(card.cost).toEqual({
      energy: 2,
      power: { 'color-1': 1, 'color-2': 2 },
    });
  });

  it.each([
    { energy: -1, power: 1, might: 0 },
    { energy: 1, power: -1, might: 0 },
    { energy: 1, power: 1, might: -1 },
    { energy: Number.NaN, power: 1, might: 1 },
    { energy: 1, power: Number.POSITIVE_INFINITY, might: 1 },
    { energy: 1, power: 1, might: Number.NaN },
  ])('refuse les valeurs invalides : %j', ({ energy, power, might }) => {
    expect(() =>
      defineUnit({
        id: 'invalid',
        name: 'Invalide',
        type: 'unit',
        cost: { energy, power: { 'color-1': power } },
        might,
      }),
    ).toThrow(RangeError);
  });

  it('conserve une définition indépendante des données de création', () => {
    const input = {
      id: 'unit',
      name: 'Unité',
      type: 'unit' as const,
      cost: { energy: 1, power: { 'color-1': 1 } },
      might: 0,
    };
    const definition = defineUnit(input);
    input.cost.power['color-1'] = 9;
    expect(definition.cost.power['color-1']).toBe(1);
  });

  it('fournit des identifiants distincts, une Might nulle et des coûts multicolores pour les scénarios', () => {
    expect(new Set(testUnits.map((card) => card.id)).size).toBe(
      testUnits.length,
    );
    expect(testUnits.some((card) => card.might === 0)).toBe(true);
    expect(
      testUnits.some((card) => Object.keys(card.cost.power).length > 1),
    ).toBe(true);
    expect(
      testUnits.every(
        (card) =>
          card.cost.energy > 0 &&
          Object.values(card.cost.power).some((value) => value > 0),
      ),
    ).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { defineGear, testGears } from './index.js';
describe('catalogue de gears', () => {
  it('définit une aura et un équipement avec coûts séparés et données figées', () => {
    expect(testGears).toHaveLength(2);
    expect(testGears[1]?.equipCost).toEqual({
      energy: 1,
      power: { 'color-1': 1 },
    });
    const input = {
      ...testGears[1]!,
      effects: [
        {
          type: 'might-bonus' as const,
          scope: 'attached-unit' as const,
          amount: 2,
        },
      ],
      equipCost: { energy: 1, power: { 'color-1': 1 } },
    };
    const copy = defineGear(input);
    input.effects[0]!.amount = 50;
    input.equipCost.power['color-1'] = 50;
    expect(copy.effects[0]?.amount).toBe(2);
    expect(copy.equipCost?.power['color-1']).toBe(1);
    expect(Object.isFrozen(copy.effects[0])).toBe(true);
    expect(Object.isFrozen(copy.equipCost?.power)).toBe(true);
  });
  it('refuse coûts invalides, bonus non fini et effet attaché sans coût d’équipement', () => {
    const gear = testGears[0]!;
    expect(() =>
      defineGear({ ...gear, cost: { energy: -1, power: {} } }),
    ).toThrow(RangeError);
    expect(() =>
      defineGear({ ...gear, equipCost: { energy: 0, power: { red: NaN } } }),
    ).toThrow(RangeError);
    expect(() =>
      defineGear({
        ...gear,
        effects: [
          { type: 'might-bonus', scope: 'allied-units', amount: Infinity },
        ],
      }),
    ).toThrow(RangeError);
    expect(() =>
      defineGear({
        ...gear,
        effects: [{ type: 'might-bonus', scope: 'attached-unit', amount: 2 }],
      }),
    ).toThrow(RangeError);
  });
});

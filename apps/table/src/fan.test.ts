import { expect, it } from 'vitest';
import { fanLayout } from './fan.js';

it('garde une carte seule droite et centre les éventails pairs et impairs', () => {
  expect(fanLayout(0)).toEqual([]);
  expect(fanLayout(1)).toEqual([{ angle: 0, lift: 0 }]);
  for (const count of [2, 5, 12, 39]) {
    const fan = fanLayout(count);
    expect(fan).toHaveLength(count);
    expect(fan[0]!.angle).toBe(-fan.at(-1)!.angle);
    expect(fan[0]!.lift).toBe(fan.at(-1)!.lift);
    expect(Math.abs(fan[0]!.angle)).toBeLessThanOrEqual(12);
  }
  expect(fanLayout(5)[2]).toEqual({ angle: 0, lift: 0 });
});

import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { buffUnit } from './effects/buff.js';
import { settOrder, mobilize } from '../../game-data/src/index.js';

it('Sett (Order) : +1 Might par unité alliée buffée de son champ, lui compris', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [settOrder];
  s.units[0] = { ...s.units[0]!, definitionId: settOrder.id, might: 5 };
  s.units.push(
    { ...s.units[0]!, id: 'pal', definitionId: 'x', might: 1 },
    {
      ...s.units[0]!,
      id: 'home',
      definitionId: 'x',
      might: 1,
      zoneId: 'base-a',
    },
  );
  s = buffUnit(buffUnit(buffUnit(s, 'pal'), 'home'), 'enemy');
  expect(effectiveMight(s.units[0]!, s)).toBe(6);
  s = buffUnit(s, 'ally');
  expect(effectiveMight(s.units[0]!, s)).toBe(8);
  expect(settOrder.tank).toBe(true);
});

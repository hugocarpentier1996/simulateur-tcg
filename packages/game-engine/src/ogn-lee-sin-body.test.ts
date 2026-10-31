import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { buffUnit } from './effects/buff.js';
import { leeSinBody, mobilize } from '../../game-data/src/index.js';

it('Lee Sin (Body) : les autres alliés buffés de son champ ont +2 Might', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [leeSinBody];
  s.units.push({
    ...s.units[0]!,
    id: 'lee',
    definitionId: leeSinBody.id,
    might: 6,
  });
  const might = (id: string) =>
    effectiveMight(
      s.units.find((u) => u.id === id)!,
      s,
    );
  expect(might('ally')).toBe(s.units[0]!.might);
  s = buffUnit(s, 'ally');
  expect(might('ally')).toBe(s.units[0]!.might + 3);
  s = buffUnit(s, 'lee');
  expect(might('lee')).toBe(7);
  expect(leeSinBody.accelerate).toEqual({ power: 'orange' });
});

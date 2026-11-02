import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { overtOperation } from '../../game-data/src/index.js';

it('Overt Operation : les alliées Tap buffées dépensent leur buff pour se redresser, puis toutes sont buffées', () => {
  const s = spellScenario(overtOperation);
  s.resources.a = { energy: 5, power: { orange: 2 } };
  s.units = [
    { ...s.units[0]!, id: 'tapped-buffed', ready: false, buffed: true },
    { ...s.units[0]!, id: 'tapped', ready: false },
    { ...s.units[0]!, id: 'ready-buffed', ready: true, buffed: true },
    s.units[1]!,
  ];
  const after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  const unit = (id: string) => after.units.find((u) => u.id === id)!;
  expect(unit('tapped-buffed')).toMatchObject({ ready: true, buffed: true });
  expect(unit('tapped')).toMatchObject({ ready: false, buffed: true });
  expect(unit('ready-buffed')).toMatchObject({ ready: true, buffed: true });
  expect(unit('enemy').buffed).toBeUndefined();
});

it('Overt Operation : avec « toujours demander », chaque unité est proposée ; refuser la laisse Tap', () => {
  const s = spellScenario(overtOperation);
  s.preferences = { a: { askOptional: true } };
  s.resources.a = { energy: 5, power: { orange: 2 } };
  s.units = [
    { ...s.units[0]!, id: 'one', ready: false, buffed: true },
    { ...s.units[0]!, id: 'two', ready: false, buffed: true },
    s.units[1]!,
  ];
  let after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  expect(after.pendingModeChoice?.modes).toEqual([
    'skip',
    'overt:one',
    'overt:two',
  ]);
  after = step(after, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'overt:two',
  });
  expect(after.pendingModeChoice?.modes).toEqual(['skip', 'overt:one']);
  after = step(after, { type: 'choose-mode', playerId: 'a', mode: 'skip' });
  const unit = (id: string) => after.units.find((u) => u.id === id)!;
  expect(unit('two')).toMatchObject({ ready: true, buffed: true });
  expect(unit('one')).toMatchObject({ ready: false, buffed: true });
});

import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { qiyana, stupefy } from '../../game-data/src/index.js';

function conquered() {
  let s = spellScenario(stupefy);
  s.unitDefinitions = [qiyana];
  s.units = [
    { ...s.units[0]!, definitionId: qiyana.id, zoneId: 'base-a', might: 4 },
  ];
  s.cards.push({
    id: 'rune-0',
    definitionId: 'rune',
    ownerId: 'a',
    zoneId: 'rune-pile-a',
    color: 'orange',
  });
  s.battlefields[1]!.controllerId = null;
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  });
  s = step(s, { type: 'pass', playerId: 'a' });
  s = step(s, { type: 'pass', playerId: 'b' });
  return resolveTop(s);
}

it('Qiyana : à la conquête, son propriétaire choisit piocher 1 ou canaliser 1 rune Tap', () => {
  const s = conquered();
  expect(s.pendingModeChoice).toMatchObject({ ownerId: 'a', sourceId: 'ally' });
  expect(getLegalActions(s, 'a')).toEqual([
    { type: 'choose-mode', playerId: 'a', mode: 'draw' },
    { type: 'choose-mode', playerId: 'a', mode: 'channel-exhausted' },
  ]);
  expect(act(s, { type: 'choose-mode', playerId: 'b', mode: 'draw' }).ok).toBe(
    false,
  );
  const drawn = step(s, { type: 'choose-mode', playerId: 'a', mode: 'draw' });
  expect(drawn.pendingModeChoice ?? null).toBeNull();
  expect(drawn.cards.find((c) => c.id === 'draw-a-0')!.zoneId).toBe('hand-a');
  const channeled = step(s, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'channel-exhausted',
  });
  expect(channeled.cards.find((c) => c.id === 'rune-0')).toMatchObject({
    zoneId: 'runes-a',
    ready: false,
  });
});

import { expect, it } from 'vitest';
import { spellScenario, step } from './origins-test-fixtures.js';
import { hallowedTomb, stupefy } from '../../game-data/src/index.js';
import { queueHoldDraw } from './effects/hold-channel.js';
import { resolveModeChoice } from './effects/mode-choice.js';

function scenario(championZoneEmpty: boolean) {
  const s = spellScenario(stupefy);
  s.battlefieldDefinitions = [hallowedTomb];
  s.battlefields[0]!.definitionId = hallowedTomb.id;
  s.zones.push({ id: 'champion-a', kind: 'champion', ownerId: 'a' });
  s.chosenChampions = { a: 'champ' };
  s.cards.push({
    id: 'champ',
    definitionId: 'filler',
    ownerId: 'a',
    zoneId: 'graveyard-a',
  });
  if (!championZoneEmpty)
    s.cards.push({
      id: 'other',
      definitionId: 'filler',
      ownerId: 'a',
      zoneId: 'champion-a',
    });
  return s;
}

it('Hallowed Tomb : à la tenue, le Chosen Champion peut revenir du cimetière', () => {
  const s = queueHoldDraw(scenario(true), 'a', 'f');
  const entry = s.stack!.entries.at(-1)!;
  expect(entry).toMatchObject({
    kind: 'mode-choice',
    modes: ['skip', 'return-champion'],
  });
  const pending = resolveModeChoice(s, entry as never).state;
  const after = step(pending, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'return-champion',
  });
  expect(after.cards.find((c) => c.id === 'champ')?.zoneId).toBe('champion-a');
});

it('Hallowed Tomb : rien si la zone champion est occupée', () => {
  expect(queueHoldDraw(scenario(false), 'a', 'f').stack ?? null).toBeNull();
});

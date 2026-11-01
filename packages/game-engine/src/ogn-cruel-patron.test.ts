import { expect, it } from 'vitest';
import { spellScenario, step } from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { cruelPatron, stupefy } from '../../game-data/src/index.js';
import { noRunes } from './origins-test-fixtures.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [cruelPatron];
  s.cards.push({
    id: 'patron',
    definitionId: cruelPatron.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 4, power: {} };
  return s;
}
const play = (sacrificeUnitId?: string) => ({
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'patron',
  ...(sacrificeUnitId ? { sacrificeUnitId } : {}),
  payment: noRunes,
});

it('Cruel Patron : tuer une unité alliée est un coût supplémentaire obligatoire', () => {
  expect(act(scenario(), play()).ok).toBe(false);
  expect(act(scenario(), play('enemy')).ok).toBe(false);
  const s = step(scenario(), play('ally'));
  expect(s.units.map((u) => u.id)).toEqual(['enemy', 'patron']);
  expect(s.cards.find((c) => c.id === 'ally')?.zoneId).toBe('graveyard-a');
  const options = getLegalActions(scenario(), 'a').filter(
    (a) => a.type === 'play-unit',
  );
  expect(
    options.every(
      (a) => a.type === 'play-unit' && a.sacrificeUnitId === 'ally',
    ),
  ).toBe(true);
  expect(options.length).toBeGreaterThan(0);
});

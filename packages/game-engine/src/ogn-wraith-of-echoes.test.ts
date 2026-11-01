import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { wraithOfEchoes, hextechRay } from '../../game-data/src/index.js';

it('Wraith of Echoes : la première mort alliée du tour fait piocher 1, pas la suivante', () => {
  let s = spellScenario(hextechRay);
  s.spellDefinitions = [hextechRay];
  s.unitDefinitions = [wraithOfEchoes];
  s.cards.push({
    id: 'ray-2',
    definitionId: hextechRay.id,
    ownerId: 'b',
    zoneId: 'hand-b',
  });
  s.units.push(
    {
      ...s.units[1]!,
      id: 'wraith',
      definitionId: wraithOfEchoes.id,
      zoneId: 'base-b',
      might: 5,
    },
    { ...s.units[1]!, id: 'enemy-2', might: 1 },
  );
  s.units[1] = { ...s.units[1]!, might: 1 };
  s.resources.a = { energy: 2, power: { rouge: 2 } };
  s.cards.push({
    id: 'ray-a2',
    definitionId: hextechRay.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(s.cards.find((c) => c.id === 'draw-b-0')?.zoneId).toBe('hand-b');
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'ray-a2',
      targetId: 'enemy-2',
      payment: noRunes,
    }),
  );
  expect(
    s.cards.filter((c) => c.id.startsWith('draw-b') && c.zoneId === 'hand-b'),
  ).toHaveLength(1);
});

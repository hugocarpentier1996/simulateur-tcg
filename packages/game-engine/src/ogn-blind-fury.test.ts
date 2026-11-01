import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { blindFury, kinkouMonk } from '../../game-data/src/index.js';

it('Blind Fury : révèle le dessus du deck adverse ; une unité est jouée gratuitement sous son contrôle', () => {
  const s0 = spellScenario(blindFury);
  s0.unitDefinitions = [kinkouMonk];
  s0.zones.push({ id: 'banished-b', kind: 'banished', ownerId: 'b' });
  s0.cards = s0.cards.filter((c) => c.zoneId !== 'deck-b');
  s0.cards.push({
    id: 'monk',
    definitionId: kinkouMonk.id,
    ownerId: 'b',
    zoneId: 'deck-b',
  });
  s0.resources.a = { energy: 4, power: { rouge: 2 } };
  const s = resolveTop(
    step(s0, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  expect(s.units.find((u) => u.id === 'monk')).toMatchObject({
    ownerId: 'a',
    cardOwnerId: 'b',
    zoneId: 'base-a',
  });
});

it('Blind Fury : une carte non jouable reste bannie', () => {
  const s0 = spellScenario(blindFury);
  s0.zones.push({ id: 'banished-b', kind: 'banished', ownerId: 'b' });
  s0.cards = s0.cards.filter((c) => c.zoneId !== 'deck-b');
  s0.cards.push({
    id: 'odd',
    definitionId: 'filler',
    ownerId: 'b',
    zoneId: 'deck-b',
  });
  s0.resources.a = { energy: 4, power: { rouge: 2 } };
  const s = resolveTop(
    step(s0, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  expect(s.cards.find((c) => c.id === 'odd')?.zoneId).toBe('banished-b');
});

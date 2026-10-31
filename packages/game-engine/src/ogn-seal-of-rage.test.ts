import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { act } from './act.js';
import { sealOfRage, incinerate } from '../../game-data/src/index.js';

function withSeal() {
  let s = spellScenario(incinerate);
  s.gearDefinitions = [sealOfRage];
  s.cards.push({
    id: 'seal',
    definitionId: sealOfRage.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 0, power: { rouge: 1 } };
  s = step(s, {
    type: 'play-gear',
    playerId: 'a',
    cardId: 'seal',
    payment: noRunes,
  });
  return s;
}

it('Seal of Rage : 0 énergie et 1 Fury, arrive Ready ; Tap pour ajouter 1 Power Fury', () => {
  let s = withSeal();
  expect(s.gears![0]).toMatchObject({ ready: true, zoneId: 'base-a' });
  expect(s.resources.a).toMatchObject({ energy: 0, power: { rouge: 0 } });
  s = step(s, { type: 'activate-gear', playerId: 'a', gearId: 'seal' });
  expect(s.gears![0]!.ready).toBe(false);
  expect(s.resources.a!.power.rouge).toBe(1);
  expect(s.stack ?? null).toBeNull();
  expect(
    act(s, { type: 'activate-gear', playerId: 'a', gearId: 'seal' }).ok,
  ).toBe(false);
});

it('Seal of Rage s’active en réaction, sans ouvrir de pile, mais pas sans priorité', () => {
  const s = withSeal();
  const pending = step(
    { ...s, resources: { ...s.resources, a: { energy: 2, power: {} } } },
    {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    },
  );
  const reacted = step(pending, {
    type: 'activate-gear',
    playerId: 'a',
    gearId: 'seal',
  });
  expect(reacted.stack!.entries).toHaveLength(1);
  expect(
    act(pending, { type: 'activate-gear', playerId: 'b', gearId: 'seal' }).ok,
  ).toBe(false);
});

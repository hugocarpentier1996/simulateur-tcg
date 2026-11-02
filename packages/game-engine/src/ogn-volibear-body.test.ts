import { expect, it } from 'vitest';
import { spellScenario, step, drain } from './origins-test-fixtures.js';
import { volibearBody, mobilize } from '../../game-data/src/index.js';

function scenario(volibearZone: string) {
  const s = spellScenario(mobilize);
  s.unitDefinitions = [volibearBody];
  s.activePlayerId = 'b';
  s.units.push({
    ...s.units[0]!,
    id: 'voli',
    definitionId: volibearBody.id,
    zoneId: volibearZone,
    might: 10,
  });
  s.units[1] = { ...s.units[1]!, zoneId: 'base-b' };
  s.battlefields = s.battlefields.map((f) => ({ ...f, controllerId: null }));
  s.units = s.units.filter((u) => u.id !== 'ally');
  return drain(
    step(s, {
      type: 'move',
      playerId: 'b',
      unitId: 'enemy',
      destinationId: 'g',
    }),
  );
}

it('Volibear (Body) : un adversaire qui va sur un autre champ fait piocher 1', () => {
  expect(scenario('f').cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe(
    'hand-a',
  );
});

it('Volibear (Body) : rien si c’est son champ', () => {
  expect(scenario('g').cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe(
    'deck-a',
  );
  expect(volibearBody).toMatchObject({ shield: 3, tank: true });
});

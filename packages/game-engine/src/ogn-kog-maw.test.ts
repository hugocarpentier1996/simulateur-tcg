import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions, type GameState } from './index.js';
import { kogMaw, hextechRay } from '../../game-data/src/index.js';

function killKogMaw(zoneId: string): GameState {
  let s = spellScenario(hextechRay);
  s.unitDefinitions = [kogMaw];
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  s.units[1] = { ...s.units[1]!, definitionId: kogMaw.id, might: 1, zoneId };
  s.units.push(
    { ...s.units[0]!, id: 'friend-of-kog', ownerId: 'b', zoneId, might: 9 },
    { ...s.units[0]!, id: 'bystander', zoneId: 'f', might: 9 },
  );
  s.battlefields[1]!.controllerId = 'b';
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  s = step(
    s,
    getLegalActions(s, 'b').find((a) => a.type === 'queue-death-effects')!,
  );
  return resolveTop(s);
}

it('Kog’Maw : Deathknell, 4 dégâts à toutes les unités de son champ, alliées comprises', () => {
  const s = killKogMaw('g');
  expect(s.units.find((u) => u.id === 'friend-of-kog')!.damage).toBe(4);
  expect(s.units.find((u) => u.id === 'bystander')!.damage).toBe(0);
});

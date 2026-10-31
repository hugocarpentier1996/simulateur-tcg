import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { act } from './index.js';
import { vilemawsLair, mobilize } from '../../game-data/src/index.js';

it('Vilemaw’s Lair : impossible de se déplacer de ce champ vers la base', () => {
  const s = spellScenario(mobilize);
  s.battlefieldDefinitions = [vilemawsLair];
  const retreat = {
    type: 'move' as const,
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'base-a',
  };
  expect(act(s, retreat).ok).toBe(true);
  s.battlefields[0]!.definitionId = vilemawsLair.id;
  expect(act(s, retreat).ok).toBe(false);
});

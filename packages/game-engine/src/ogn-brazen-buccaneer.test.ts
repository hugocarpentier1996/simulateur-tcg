import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { brazenBuccaneer, stupefy } from '../../game-data/src/index.js';

function scenario(energy: number) {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [brazenBuccaneer];
  s.cards.push({
    id: 'pirate',
    definitionId: brazenBuccaneer.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy, power: {} };
  return s;
}
const play = (discardCardId?: string) => ({
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'pirate',
  ...(discardCardId ? { discardCardId } : {}),
  payment: noRunes,
});

it('Brazen Buccaneer : défausser 1 carte réduit son coût de 2 énergie', () => {
  expect(act(scenario(4), play()).ok).toBe(false);
  const s = step(scenario(4), play('spell'));
  expect(s.units.some((u) => u.id === 'pirate')).toBe(true);
  expect(s.cards.find((c) => c.id === 'spell')?.zoneId).toBe('graveyard-a');
  expect(s.resources.a?.energy).toBe(0);
  expect(step(scenario(6), play()).resources.a?.energy).toBe(0);
});

it('Brazen Buccaneer : seule une autre carte de sa main peut être défaussée', () => {
  expect(act(scenario(4), play('pirate')).ok).toBe(false);
  expect(act(scenario(4), play('draw-a-0')).ok).toBe(false);
  const options = getLegalActions(scenario(4), 'a').flatMap((a) =>
    a.type === 'play-unit' ? [a.discardCardId] : [],
  );
  expect(new Set(options)).toEqual(new Set(['spell']));
});

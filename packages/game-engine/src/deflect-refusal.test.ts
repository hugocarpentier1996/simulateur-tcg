import { expect, it } from 'vitest';
import { act, getLegalActions } from './index.js';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import {
  hextechRay,
  poutyPoro,
  blastconeFae,
} from '../../game-data/src/index.js';

function scenario(allow: boolean) {
  const s = spellScenario(hextechRay);
  s.unitDefinitions = [poutyPoro];
  s.units[1] = { ...s.units[1]!, definitionId: poutyPoro.id, might: 5 };
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  if (allow) s.preferences = { a: { allowDeflectRefusal: true } };
  return s;
}
const cast = (refuseDeflect?: boolean) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'enemy',
  ...(refuseDeflect ? { refuseDeflect } : {}),
  payment: noRunes,
});

it('Deflect : par défaut la taxe est due (impayable ici) et le refus est interdit', () => {
  expect(act(scenario(false), cast()).ok).toBe(false);
  expect(act(scenario(false), cast(true)).ok).toBe(false);
});

it('Deflect refusé (option) : le sort se lance sans la taxe et son effet sur l’unité fizzle', () => {
  const s0 = scenario(true);
  expect(
    getLegalActions(s0, 'a').some(
      (a) =>
        a.type === 'cast-spell' && a.targetId === 'enemy' && a.refuseDeflect,
    ),
  ).toBe(true);
  const s = resolveTop(step(s0, cast(true)));
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(0);
  expect(s.cards.find((c) => c.id === 'spell')?.zoneId).toBe('graveyard-a');
});

it('Deflect refusé (option) pour une capacité de mise en jeu : l’unité est jouée, la capacité sur la cible fizzle', () => {
  const s0 = spellScenario(hextechRay);
  s0.unitDefinitions = [poutyPoro, blastconeFae];
  s0.units[1] = { ...s0.units[1]!, definitionId: poutyPoro.id, might: 5 };
  s0.cards.push({
    id: 'fae',
    definitionId: blastconeFae.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s0.resources.a = { energy: 2, power: { bleu: 1 } };
  s0.preferences = { a: { allowDeflectRefusal: true } };
  const play = {
    type: 'play-unit' as const,
    playerId: 'a',
    cardId: 'fae',
    destinationId: 'base-a',
    onPlayTargetId: 'enemy',
    refuseDeflect: true,
    payment: noRunes,
  };
  expect(getLegalActions(s0, 'a')).toContainEqual(play);
  const paying = { ...play, refuseDeflect: false };
  expect(act(s0, paying).ok).toBe(false);
  const s = resolveTop(step(s0, play));
  expect(s.units.some((u) => u.id === 'fae')).toBe(true);
  expect(s.units.find((u) => u.id === 'enemy')?.temporaryEffects ?? []).toEqual(
    [],
  );
});

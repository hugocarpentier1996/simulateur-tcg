import { finishCombat } from './combat/finish.js';
import { queueDefenseShield } from './effects/defense-shield.js';
import { expect, it } from 'vitest';
import { fortifiedPosition, gust, flash } from '../../game-data/src/index.js';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './act.js';
import { getLegalActions } from './legal/actions.js';
import { effectiveMight } from './effects/modifiers.js';
function setup() {
  const s = spellScenario(gust);
  s.battlefieldDefinitions = [fortifiedPosition];
  s.battlefields[1]!.definitionId = fortifiedPosition.id;
  s.units[0]!.zoneId = 'base-a';
  return s;
}
const move = {
  type: 'move' as const,
  playerId: 'a',
  unitId: 'ally',
  destinationId: 'g',
};
const choice = {
  type: 'choose-defense-shield' as const,
  playerId: 'b',
  targetId: 'enemy',
  payment: noRunes,
};
it('défense : cible avant réactions, Shield seulement après résolution et seulement ce combat', () => {
  let s = step(setup(), move);
  expect(s.pendingDefenseShield).toMatchObject({
    ownerId: 'b',
    battlefieldId: 'g',
    amount: 2,
  });
  expect(act(s, { type: 'pass', playerId: 'a' }).ok).toBe(false);
  expect(getLegalActions(s, 'b')).toContainEqual(choice);
  expect(act(s, { ...choice, playerId: 'a' }).ok).toBe(false);
  s = step(s, choice);
  expect(s.stack?.priorityPlayerId).toBe('a');
  expect(effectiveMight(s.units[1]!, s)).toBe(3);
  s = resolveTop(s);
  expect(effectiveMight(s.units[1]!, s)).toBe(5);
  expect(effectiveMight(s.units[0]!, s)).toBe(3);
  expect(effectiveMight(s.units[1]!, { ...s, showdown: null })).toBe(3);
  s = step(s, { type: 'pass', playerId: s.showdown!.priorityPlayerId });
  expect(s.pendingDefenseShield).toBeNull();
});
it('Open ne déclenche rien ; cible sortie en réaction ne reçoit aucun bonus', () => {
  const empty = setup();
  empty.units = empty.units.filter((u) => u.id !== 'enemy');
  empty.battlefields[1]!.controllerId = null;
  expect(step(empty, move).pendingDefenseShield).toBeUndefined();
  let s = step(step(setup(), move), choice);
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: noRunes,
  });
  s = resolveTop(s);
  s = resolveTop(s);
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
});
it('une cible en base peut être choisie mais Shield ne renforce que les défenseurs', () => {
  const initial = setup();
  initial.units.push({ ...initial.units[1]!, id: 'reserve', zoneId: 'base-b' });
  let s = step(step(initial, move), { ...choice, targetId: 'reserve' });
  s = resolveTop(s);
  expect(
    effectiveMight(
      s.units.find((u) => u.id === 'reserve')!,
      s,
    ),
  ).toBe(3);
  expect(effectiveMight(s.units[1]!, s)).toBe(3);
});
it('une réaction déplaçant le défenseur en base supprime le bénéfice', () => {
  const initial = setup();
  initial.spellDefinitions = [flash];
  initial.cards[0]!.definitionId = flash.id;
  initial.cards[0]!.ownerId = 'b';
  initial.cards[0]!.zoneId = 'hand-b';
  initial.resources.b!.power = { vert: 2 };
  let s = step(step(initial, move), choice);
  s = step(s, { type: 'pass', playerId: 'a' });
  s = step(s, {
    type: 'cast-spell',
    playerId: 'b',
    cardId: 'spell',
    targetId: 'b',
    selectedUnitIds: ['enemy'],
    payment: noRunes,
  });
  s = resolveTop(s);
  s = resolveTop(s);
  expect(
    effectiveMight(
      s.units.find((u) => u.id === 'enemy')!,
      s,
    ),
  ).toBe(3);
});

it('un nouveau combat après réinvocation ne conserve pas le Shield du précédent', () => {
  let s = resolveTop(step(step(setup(), move), choice));
  expect(s.showdown?.kind === 'combat' && s.showdown.shieldBonuses?.enemy).toBe(
    2,
  );
  const restarted = finishCombat({
    ...s,
    combatAftermath: { defenderEliminated: true },
  });
  s = queueDefenseShield(s, restarted.state, restarted.events);
  expect(s.pendingDefenseShield).toMatchObject({ ownerId: 'b' });
  expect(effectiveMight(s.units[1]!, s)).toBe(3);
  s = resolveTop(step(s, choice));
  expect(effectiveMight(s.units[1]!, s)).toBe(5);
});

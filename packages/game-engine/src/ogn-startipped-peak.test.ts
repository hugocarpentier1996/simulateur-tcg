import { expect, it } from 'vitest';
import { startippedPeak, gust } from '../../game-data/src/index.js';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { startTurn } from './turn/progression.js';
import { act } from './act.js';
import { getLegalActions } from './legal/actions.js';
function setup(count = 4) {
  const s = spellScenario(gust);
  s.battlefieldDefinitions = [startippedPeak];
  s.battlefields[0]!.definitionId = startippedPeak.id;
  s.cards.push(
    ...Array.from({ length: count }, (_, i) => ({
      id: 'r' + i,
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'rune-pile-a',
      color: 'vert',
    })),
  );
  return s;
}
it.each([true, false])(
  'Hold suspend Beginning, ouvre réactions puis propose Channel facultatif : %s',
  (accept) => {
    let s = startTurn(setup()).state;
    expect(s.phase).toBe('beginning');
    expect(s.players[0]!.score).toBe(1);
    expect(s.stack?.entries.at(-1)).toMatchObject({
      kind: 'hold-channel',
      ownerId: 'a',
    });
    expect(s.cards.filter((c) => c.zoneId === 'runes-a')).toHaveLength(0);
    expect(act(s, { type: 'end-turn', playerId: 'a' }).ok).toBe(false);
    s = resolveTop(s);
    const choice = {
      type: 'choose-hold-channel' as const,
      playerId: 'a',
      accept,
    };
    expect(getLegalActions(s, 'a')).toContainEqual(choice);
    expect(act(s, { ...choice, playerId: 'b' }).ok).toBe(false);
    s = step(s, choice);
    expect(s.phase).toBe('main');
    expect(s.players[0]!.score).toBe(1);
    expect(s.cards.filter((c) => c.zoneId === 'runes-a')).toHaveLength(
      accept ? 3 : 2,
    );
    expect(s.cards.find((c) => c.id === 'r0')?.ready).toBe(!accept);
    expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
    expect(s.pendingTurnStart).toBe(false);
  },
);
it('pile vide : accepter ne crée aucune rune, puis Draw suit normalement', () => {
  let s = resolveTop(startTurn(setup(0)).state);
  s = step(s, { type: 'choose-hold-channel', playerId: 'a', accept: true });
  expect(s.cards.filter((c) => c.zoneId === 'runes-a')).toHaveLength(0);
  expect(s.phase).toBe('main');
  expect(s.players[0]!.score).toBe(1);
});
it('la conquête ne déclenche pas Peak ; un Hold gagnant termine sans fenêtre', () => {
  const input = setup();
  input.battlefields[0]!.controllerId = null;
  input.units[0]!.zoneId = 'base-a';
  let s = step(input, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'f',
  });
  s = step(s, { type: 'pass', playerId: 'a' });
  s = step(s, { type: 'pass', playerId: 'b' });
  expect(s.stack).toBeFalsy();
  const winning = setup();
  winning.players[0]!.score = 7;
  s = startTurn(winning).state;
  expect(s.result?.winnerId).toBe('a');
  expect(s.stack).toBeFalsy();
});
it('fin du tour adverse : la tenue suspend le nouveau tour avant Channel et ne redonne pas le point', () => {
  const input = setup();
  input.activePlayerId = 'b';
  let s = step(input, { type: 'end-turn', playerId: 'b' });
  expect(s.phase).toBe('beginning');
  expect(s.activePlayerId).toBe('a');
  s = resolveTop(s);
  s = step(s, { type: 'choose-hold-channel', playerId: 'a', accept: true });
  expect(s.phase).toBe('main');
  expect(s.players[0]!.score).toBe(1);
  expect(s.cards.filter((c) => c.zoneId === 'runes-a')).toHaveLength(3);
});

it('une réaction retire le contrôleur, mais la capacité déjà déclenchée se résout avant Channel', () => {
  const input = setup();
  input.cards[0]!.ownerId = 'b';
  input.cards[0]!.zoneId = 'hand-b';
  input.resources.b!.power = { vert: 1 };
  let s = startTurn(input).state;
  s = step(s, { type: 'pass', playerId: 'a' });
  s = step(s, {
    type: 'cast-spell',
    playerId: 'b',
    cardId: 'spell',
    targetId: 'ally',
    payment: { energyRunes: [], powerRunes: [] },
  });
  s = resolveTop(s);
  expect(s.phase).toBe('beginning');
  expect(s.battlefields[0]!.controllerId).toBeNull();
  s = resolveTop(s);
  s = step(s, { type: 'choose-hold-channel', playerId: 'a', accept: true });
  expect(s.phase).toBe('main');
  expect(s.cards.filter((c) => c.zoneId === 'runes-a')).toHaveLength(3);
});
it('deux Peaks tenus : deux capacités séparées, une seule reprise de Channel/Draw', () => {
  const input = setup(6);
  input.battlefields[1]!.definitionId = startippedPeak.id;
  input.battlefields[1]!.controllerId = 'a';
  input.units[1]!.ownerId = 'a';
  let s = resolveTop(startTurn(input).state);
  s = step(s, { type: 'choose-hold-channel', playerId: 'a', accept: true });
  expect(s.phase).toBe('beginning');
  expect(s.cards.filter((c) => c.zoneId === 'runes-a')).toHaveLength(1);
  s = resolveTop(s);
  s = step(s, { type: 'choose-hold-channel', playerId: 'a', accept: true });
  expect(s.phase).toBe('main');
  expect(s.cards.filter((c) => c.zoneId === 'runes-a')).toHaveLength(4);
  expect(
    s.cards.filter((c) => c.zoneId === 'runes-a' && !c.ready),
  ).toHaveLength(2);
  expect(s.players[0]!.score).toBe(2);
  expect(
    s.cards.filter((c) => c.zoneId === 'hand-a' && c.id.startsWith('draw')),
  ).toHaveLength(1);
});

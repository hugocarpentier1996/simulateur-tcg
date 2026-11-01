import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { buffUnit } from './effects/buff.js';
import { wildclawShaman, mobilize } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(mobilize);
  s.unitDefinitions = [wildclawShaman];
  s.cards[0]!.definitionId = wildclawShaman.id;
  s.resources.a = { energy: 4, power: {} };
  return s;
}

it('Wildclaw Shaman : peut dépenser le buff d’un allié pour se buffer et se redresser', () => {
  const buffed = buffUnit(scenario(), 'ally');
  const choices = getLegalActions(buffed, 'a').flatMap((a) =>
    a.type === 'play-unit' ? [a.onPlayTargetId ?? '-'] : [],
  );
  expect(new Set(choices)).toEqual(new Set(['-', 'ally']));
  const s = resolveTop(
    step(buffed, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'spell',
      onPlayTargetId: 'ally',
      payment: noRunes,
    }),
  );
  expect(s.units.find((u) => u.id === 'ally')?.buffed).toBeUndefined();
  expect(s.units.find((u) => u.id === 'spell')).toMatchObject({
    buffed: true,
    ready: true,
  });
});

it('Wildclaw Shaman : sans buff allié, aucune option', () => {
  const choices = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'play-unit' ? [a.onPlayTargetId ?? '-'] : [],
  );
  expect(new Set(choices)).toEqual(new Set(['-']));
});

import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './act.js';
import { getLegalActions } from './legal/actions.js';
import { annieFury } from '../../game-data/src/index.js';
import { singularity } from '../../game-data/src/index.js';
const cast = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'a',
  payment: noRunes,
};
function setup() {
  const s = spellScenario(singularity);
  s.resources.a!.power = { bleu: 2 };
  s.units = s.units.map((u) => ({ ...u, might: 9 }));
  return s;
}
it.each(
  [[], ['enemy'], ['ally', 'enemy']].map((selectedUnitIds) => ({
    selectedUnitIds,
  })),
)('Singularity accepte zéro à deux cibles : %j', ({ selectedUnitIds }) => {
  let s = setup();
  expect(getLegalActions(s, 'a')).toContainEqual({ ...cast, selectedUnitIds });
  s = resolveTop(step(s, { ...cast, selectedUnitIds }));
  expect(s.units.map((u) => u.damage)).toEqual(
    ['ally', 'enemy'].map((id) => (selectedUnitIds.includes(id) ? 6 : 0)),
  );
});
it('refuse doublons et trop de cibles ; les bonus de dégâts sont fixés avant les morts', () => {
  const s = setup();
  expect(act(s, { ...cast, selectedUnitIds: ['enemy', 'enemy'] }).ok).toBe(
    false,
  );
  expect(
    act(s, { ...cast, selectedUnitIds: ['ally', 'enemy', 'absent'] }).ok,
  ).toBe(false);
  s.unitDefinitions = [annieFury];
  s.units[0]!.definitionId = annieFury.id;
  s.units[0]!.might = 3;
  s.units[1]!.might = 7;
  const next = resolveTop(
    step(s, { ...cast, selectedUnitIds: ['ally', 'enemy'] }),
  );
  expect(next.units).toHaveLength(0);
});

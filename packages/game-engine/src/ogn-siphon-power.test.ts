import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { effectiveMight } from './index.js';
import { siphonPower } from '../../game-data/src/index.js';

it('Siphon Power : sur le champ choisi, alliés +1 et ennemis -1 (minimum 1) jusqu’à la fin du tour', () => {
  let s = spellScenario(siphonPower);
  s.resources.a = { energy: 2, power: { bleu: 1 } };
  s.units = [
    { ...s.units[0]!, zoneId: 'g' },
    { ...s.units[1]!, zoneId: 'g' },
    { ...s.units[1]!, id: 'tiny', might: 1, zoneId: 'g' },
    { ...s.units[1]!, id: 'away', zoneId: 'f' },
  ];
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'g',
      payment: noRunes,
    }),
  );
  const might = (id: string) =>
    effectiveMight(
      s.units.find((u) => u.id === id)!,
      s,
    );
  expect([might('ally'), might('enemy'), might('tiny'), might('away')]).toEqual(
    [4, 2, 1, 3],
  );
});

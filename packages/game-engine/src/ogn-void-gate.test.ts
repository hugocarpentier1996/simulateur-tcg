import { expect, it } from 'vitest';
import { voidGate, gust } from '../../game-data/src/index.js';
import { spellScenario } from './origins-test-fixtures.js';
import { dealEffectDamage } from './effects/effect-damage.js';
it.each(['spell', 'ability'] as const)(
  'Void Gate augmente chaque dégât de %s uniquement aux unités ici',
  (kind) => {
    const s = spellScenario(gust);
    s.battlefieldDefinitions = [voidGate];
    s.battlefields[0]!.definitionId = voidGate.id;
    const r = dealEffectDamage(
      s,
      kind === 'spell'
        ? { kind, cardId: 'spell', playerId: 'b' }
        : { kind, sourceId: 'enemy', playerId: 'b' },
      s.units,
      1,
    );
    expect(r.state.units.map((u) => u.damage)).toEqual([2, 1]);
    expect(r.events.map((e) => ('amount' in e ? e.amount : null))).toEqual([
      2, 1,
    ]);
    s.units[0]!.zoneId = 'base-a';
    expect(
      dealEffectDamage(
        s,
        { kind: 'spell', cardId: 'spell', playerId: 'a' },
        s.units,
        1,
      ).state.units.map((u) => u.damage),
    ).toEqual([1, 1]);
  },
);

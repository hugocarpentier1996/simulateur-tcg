import { describe, expect, it } from 'vitest';
import { defineSpell, testSpells, type SpellDefinition } from './index.js';

function definition(): SpellDefinition {
  return {
    id: 'test',
    name: 'Sort',
    type: 'spell',
    timing: 'normal',
    cost: { energy: 1, power: { 'color-1': 1 } },
    target: { kind: 'unit', combatRole: 'any' },
    effects: [
      { type: 'modify-might', amount: -1, duration: 'end-of-turn' },
      { type: 'draw', count: 1, player: 'caster' },
    ],
  };
}

describe('définitions des sorts', () => {
  it('accepte un malus signé suivi d’une pioche et préserve cet ordre', () => {
    const card = defineSpell(definition());
    expect(card.effects).toEqual([
      { type: 'modify-might', amount: -1, duration: 'end-of-turn' },
      { type: 'draw', count: 1, player: 'caster' },
    ]);
  });
  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    'refuse un coût invalide %s',
    (value) => {
      expect(() =>
        defineSpell({ ...definition(), cost: { energy: value, power: {} } }),
      ).toThrow(RangeError);
      expect(() =>
        defineSpell({
          ...definition(),
          cost: { energy: 1, power: { 'color-1': value } },
        }),
      ).toThrow(RangeError);
    },
  );
  it.each([0, -1, 1.5, Number.NaN])(
    'refuse une quantité de pioche invalide %s',
    (count) => {
      expect(() =>
        defineSpell({
          ...definition(),
          effects: [{ type: 'draw', count, player: 'caster' }],
        }),
      ).toThrow(RangeError);
    },
  );
  it('refuse un modificateur non fini et une définition sans effet', () => {
    expect(() =>
      defineSpell({
        ...definition(),
        effects: [
          { type: 'modify-might', amount: Number.NaN, duration: 'end-of-turn' },
        ],
      }),
    ).toThrow(RangeError);
    expect(() => defineSpell({ ...definition(), effects: [] })).toThrow(
      RangeError,
    );
  });
  it('copie et fige les effets, le ciblage et le coût', () => {
    const input = definition();
    const card = defineSpell(input);
    expect(card.effects).not.toBe(input.effects);
    expect(card.effects[0]).not.toBe(input.effects[0]);
    expect(Object.isFrozen(card.effects)).toBe(true);
    expect(Object.isFrozen(card.effects[0])).toBe(true);
    expect(Object.isFrozen(card.target)).toBe(true);
    expect(Object.isFrozen(card.cost.power)).toBe(true);
  });
  it('expose les quatre sorts avec déplacement sans Tap, durées temporaires et cible attaquante', () => {
    const [move, buff, debuff, stun] = testSpells;
    expect(move?.effects).toEqual([
      { type: 'move-unit', requiresReady: false, exhaustsUnit: false },
    ]);
    expect(buff?.effects).toEqual([
      { type: 'modify-might', amount: 2, duration: 'end-of-turn' },
    ]);
    expect(debuff?.effects).toEqual(definition().effects);
    expect(stun?.target).toEqual({ kind: 'unit', combatRole: 'attacker' });
    expect(stun?.effects).toEqual([{ type: 'stun', duration: 'end-of-turn' }]);
    expect(new Set(testSpells.map((card) => card.id)).size).toBe(4);
    expect(new Set(testSpells.map((card) => card.timing))).toEqual(
      new Set(['normal', 'action', 'reaction']),
    );
  });
});

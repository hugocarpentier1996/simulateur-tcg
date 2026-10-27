import { describe, expect, it } from 'vitest';
import {
  createDemo,
  dispatch,
  placementOptions,
  placeUnit,
} from './session.js';

describe('table locale', () => {
  it('propose uniquement les destinations avec un paiement réalisable et paie automatiquement', () => {
    const initial = createDemo();
    const options = placementOptions(initial.state, 'a-card-0');
    expect(options.map((a) => a.destinationId)).toEqual(['zone:a:base']);
    const played = placeUnit(initial, 'a-card-0', 'zone:a:base');
    expect(played.error).toBeNull();
    expect(played.state.units[0]).toMatchObject({
      id: 'a-card-0',
      zoneId: 'zone:a:base',
      ready: false,
    });
    expect(played.state.cards.find((c) => c.id === 'a-rune-0')?.zoneId).toBe(
      'zone:a:rune-pile',
    );
    expect(placementOptions(initial.state, 'a-card-2')).toEqual([]);
    expect(placementOptions(initial.state, 'b-chosen')).toEqual([]);
    expect(placeUnit(initial, 'a-chosen', 'zone:a:base').error).toBeNull();
  });

  it('refuse un dépôt invalide ou devenu impayable sans dépenser de ressources', () => {
    const initial = createDemo();
    const rejected = placeUnit(
      initial,
      'a-card-0',
      initial.state.battlefields[0]!.zoneId,
    );
    expect(rejected.error).toBeTruthy();
    expect(rejected.state).toBe(initial.state);
    const played = placeUnit(initial, 'a-chosen', 'zone:a:base');
    const tooLate = placeUnit(played, 'a-card-0', 'zone:a:base');
    expect(tooLate.error).toBeTruthy();
    expect(tooLate.state).toBe(played.state);
  });

  it('prépare une partie reproductible en Main avec main, champion et runes', () => {
    const session = createDemo();
    expect(session).toEqual(createDemo());
    expect(session.state.phase).toBe('main');
    expect(
      session.state.cards.filter((c) => c.zoneId === 'zone:a:hand'),
    ).toHaveLength(5);
    expect(
      session.state.cards.filter((c) => c.zoneId === 'zone:a:runes'),
    ).toHaveLength(2);
    expect(session.state.cards.find((c) => c.id === 'a-chosen')?.zoneId).toBe(
      'zone:a:champion',
    );
    expect(session.state.battlefields).toHaveLength(2);
  });

  it('joue depuis la main avec le paiement choisi puis change de joueur', () => {
    const initial = createDemo();
    const played = dispatch(initial, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'a-card-0',
      destinationId: 'zone:a:base',
      payment: { energyRunes: ['a-rune-0'], powerRunes: ['a-rune-0'] },
    });
    expect(played.error).toBeNull();
    expect(played.state.units).toContainEqual(
      expect.objectContaining({ id: 'a-card-0', ready: false }),
    );
    expect(initial.state.units).toHaveLength(0);
    expect(played.log.some((line) => line.includes('Éclaireur'))).toBe(true);
    const next = dispatch(played, { type: 'end-turn', playerId: 'a' });
    expect(next.state.activePlayerId).toBe('b');
    expect(next.state.phase).toBe('main');
    expect(
      next.state.cards.filter((c) => c.zoneId === 'zone:b:runes'),
    ).toHaveLength(3);
  });

  it('affiche le refus du moteur et conserve la partie et son journal', () => {
    const initial = createDemo();
    const refused = dispatch(initial, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'a-card-0',
      destinationId: 'zone:a:base',
      payment: { energyRunes: [], powerRunes: [] },
    });
    expect(refused.error).toBeTruthy();
    expect(refused.state).toBe(initial.state);
    expect(refused.log).toEqual(initial.log);
  });

  it('joue aussi le chosen champion depuis sa zone', () => {
    const played = dispatch(createDemo(), {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'a-chosen',
      destinationId: 'zone:a:base',
      payment: {
        energyRunes: ['a-rune-0', 'a-rune-1'],
        powerRunes: ['a-rune-1'],
      },
    });
    expect(played.error).toBeNull();
    expect(played.state.units.some((u) => u.id === 'a-chosen')).toBe(true);
    expect(played.state.cards.some((c) => c.id === 'a-chosen')).toBe(false);
  });
});

import { futureStep } from './promising-future.js';
import { hiddenInTrash } from './hidden.js';
import { playUnitFromTrash } from './play-from-trash.js';
import {
  hitChoice,
  judgmentStep,
  lookPlayUnitChoice,
  nextKillChoice,
  opponentHandChoice,
} from './mode-choice.js';
import { startPick } from './pick.js';
import { wardenAgainst } from './unit-aura.js';
import { buffUnit, spendBuff } from './buff.js';
import { channelForPlayer } from '../turn/supplies.js';
import { returnGraveyardCard } from './graveyard-card.js';
import { effectiveMight, preventsDamage } from './modifiers.js';
import { leaveBoard } from './leave-board.js';
import { getBattlefieldSides } from '../battlefield-areas.js';
import { dealAreaDamage } from './area-damage.js';
import type {
  ActionResult,
  GameEvent,
  GameState,
  UnitState,
} from '../types.js';
import type { SpellEntry } from '../spell-types.js';
import {
  spellTarget,
  validDestination,
  duelEnemyTarget,
  validBattlefieldTarget,
  secondaryEnemyTarget,
  stackSpellTarget,
  allyToMove,
  enemyHere,
  battlefieldUnitOrGear,
  validMightBundle,
  otherAlly,
  destinationFoe,
} from './target.js';
import { resolveDuel } from './duel.js';
import { drawCardForPlayer } from '../turn/draw.js';
import { settleLethalUnits } from './lethal-units.js';
import { dealSpellDamage } from './spell-damage.js';
import { summonToken } from './summon-token.js';
import { resolveFlash } from './flash.js';
import { killGears } from './kill-gear.js';

/** Sort payé -> effets dans l'ordre puis carte au cimetière. Aucune fenêtre au milieu
 * des instructions d'un même sort. Cible devenue illégale : effet ciblé ignoré ;
 * la pioche indépendante reste exécutée. Ces choix de prototype sont documentés. */
export function resolveSpell(
  input: GameState,
  entry: SpellEntry,
): Extract<ActionResult, { ok: true }> {
  let state = input;
  const events: GameEvent[] = [];
  for (const effect of entry.definition.effects) {
    if (state.result) break;
    if (effect.type === 'summon-recruits') {
      for (const destinationId of entry.tokenDestinations ?? []) {
        const summoned = summonToken(
          state,
          entry.casterId,
          destinationId,
          effect.definitionId,
        );
        state = summoned.state;
        events.push(...summoned.events);
      }
      continue;
    }
    if (effect.type === 'move-up-to-two-allies-to-base') {
      const moved = resolveFlash(
        state,
        entry.casterId,
        entry.selectedUnitIds ?? [],
      );
      state = moved.state;
      events.push(...moved.events);
      continue;
    }
    if (
      effect.type === 'boost-allies' ||
      effect.type === 'boost-selected-allies'
    ) {
      state = {
        ...state,
        units: state.units.map((u) =>
          u.ownerId === entry.casterId &&
          (effect.type === 'boost-allies' ||
            entry.selectedUnitIds?.includes(u.id))
            ? {
                ...u,
                temporaryEffects: [
                  ...(u.temporaryEffects ?? []),
                  { type: 'modify-might' as const, amount: effect.amount },
                ],
              }
            : u,
        ),
      };
      continue;
    }
    if (effect.type === 'play-from-trash') {
      const played = playUnitFromTrash(state, entry.casterId, entry.targetId);
      state = played.state;
      events.push(...played.events);
      continue;
    }
    if (effect.type === 'return-graveyard-unit') {
      state = returnGraveyardCard(
        state,
        entry.casterId,
        entry.targetId,
        'unit',
      );
      continue;
    }
    if (effect.type === 'channel-exhausted') {
      const channeled = channelForPlayer(state, entry.casterId, effect.count);
      state = channeled.state;
      events.push(...channeled.events);
      // Pioche de compensation si moins de runes que demandé ont pu être canalisées.
      const count = channeled.events.reduce(
        (n, e) => (e.type === 'runes-channeled' ? n + e.cardIds.length : n),
        0,
      );
      if (effect.drawIfShort && count < effect.count) {
        const drawn = drawCardForPlayer(state, entry.casterId);
        state = drawn.state;
        events.push(...drawn.events);
      }
      continue;
    }
    if (effect.type === 'units-enter-ready') {
      state = {
        ...state,
        readyEntryPlayers: [
          ...new Set([...(state.readyEntryPlayers ?? []), entry.casterId]),
        ],
      };
      continue;
    }
    if (effect.type === 'damage-selected-units') {
      const damaged = dealSpellDamage(
        state,
        entry.card.id,
        entry.casterId,
        state.units.filter((u) => entry.selectedUnitIds?.includes(u.id)),
        effect.amount,
      );
      state = damaged.state;
      events.push(...damaged.events);
      continue;
    }
    if (effect.type === 'draw') {
      const count = entry.exhaustedForCost
        ? (effect.countIfExhausted ?? effect.count)
        : effect.count;
      for (let i = 0; i < count && !state.result; i++) {
        const drawn = drawCardForPlayer(state, entry.casterId);
        state = drawn.state;
        events.push(...drawn.events);
      }
      continue;
    }
    if (effect.type === 'damage-all-at-battlefields') {
      const damaged = dealAreaDamage(
        state,
        { kind: 'spell', cardId: entry.card.id, playerId: entry.casterId },
        state.battlefields.map((f) => ({
          kind: 'battlefield' as const,
          battlefieldId: f.zoneId,
        })),
        effect.amount,
      );
      state = damaged.state;
      events.push(...damaged.events);
      continue;
    }
    if (effect.type === 'modify-battlefield-sides') {
      if (!validBattlefieldTarget(state, entry.targetId)) continue;
      const { friendly, enemy, minimum } = effect;
      state = {
        ...state,
        units: state.units.map((u) => {
          if (u.zoneId !== entry.targetId) return u;
          const base = u.ownerId === entry.casterId ? friendly : enemy;
          const amount =
            minimum === undefined || base >= 0
              ? base
              : Math.max(base, Math.min(0, minimum - effectiveMight(u, state)));
          return {
            ...u,
            temporaryEffects: [
              ...(u.temporaryEffects ?? []),
              { type: 'modify-might' as const, amount },
            ],
          };
        }),
      };
      continue;
    }
    if (effect.type === 'spend-buffs-ready-then-buff-all') {
      for (const unit of state.units.filter(
        (u) => u.ownerId === entry.casterId && u.buffed && !u.ready,
      ))
        state = {
          ...(spendBuff(state, unit.id) ?? state),
        };
      state = {
        ...state,
        units: state.units.map((u) =>
          u.ownerId === entry.casterId &&
          input.units.some((o) => o.id === u.id && o.buffed && !o.ready)
            ? { ...u, ready: true }
            : u,
        ),
      };
      for (const unit of state.units.filter(
        (u) => u.ownerId === entry.casterId,
      ))
        state = buffUnit(state, unit.id);
      continue;
    }
    if (effect.type === 'each-player-kills') {
      const order = [
        ...(effect.opponentsOnly ? [] : [entry.casterId]),
        ...state.players.map((p) => p.id).filter((id) => id !== entry.casterId),
      ];
      const choice = nextKillChoice(state, entry.card.id, effect.what, order);
      if (choice) state = { ...state, pendingModeChoice: choice };
      continue;
    }
    if (effect.type === 'each-player-may-return-unit') {
      const order = [
        ...state.players.map((p) => p.id).filter((id) => id !== entry.casterId),
        entry.casterId,
      ];
      const choice = nextKillChoice(state, entry.card.id, 'return', order);
      if (choice) state = { ...state, pendingModeChoice: choice };
      continue;
    }
    if (effect.type === 'opponent-hand-pick') {
      const choice = opponentHandChoice(
        state,
        entry.card.id,
        entry.casterId,
        effect.action,
      );
      if (choice) state = { ...state, pendingModeChoice: choice };
      continue;
    }
    if (effect.type === 'promising-future') {
      const ids = state.players.map((p) => p.id);
      const started = futureStep(state, entry.card.id, {
        casterId: entry.casterId,
        steps: [entry.casterId, ...ids.filter((id) => id !== entry.casterId)],
        chosen: [],
      });
      state = started.state;
      events.push(...started.events);
      continue;
    }
    if (effect.type === 'divine-judgment') {
      const order = [
        entry.casterId,
        ...state.players.map((p) => p.id).filter((id) => id !== entry.casterId),
      ];
      const categories = ['unit', 'gear', 'rune', 'hand'] as const;
      state = judgmentStep(
        state,
        entry.card.id,
        order.flatMap((playerId) =>
          categories.map((category) => ({ playerId, category })),
        ),
        [],
      );
      continue;
    }
    if (effect.type === 'damage-hits') {
      const choice = hitChoice(
        state,
        entry.card.id,
        entry.casterId,
        effect.count,
        effect.amount,
      );
      if (choice) state = { ...state, pendingModeChoice: choice };
      continue;
    }
    if (effect.type === 'look-play-unit') {
      const choice = lookPlayUnitChoice(
        state,
        entry.card.id,
        entry.casterId,
        effect.count,
        effect.energyReduction,
      );
      if (choice) state = { ...state, pendingModeChoice: choice };
      continue;
    }
    if (effect.type === 'party-favors') {
      const opponent = state.players.find((p) => p.id !== entry.casterId);
      if (opponent)
        state = {
          ...state,
          pendingModeChoice: {
            kind: 'mode-choice',
            sourceId: entry.card.id,
            ownerId: opponent.id,
            partnerId: entry.casterId,
            modes: ['favor-cards', 'favor-runes'],
          },
        };
      continue;
    }
    if (effect.type === 'extra-turn') {
      state = {
        ...state,
        extraTurns: [...(state.extraTurns ?? []), entry.casterId],
      };
      continue;
    }
    if (effect.type === 'return-hidden-free-hide') {
      const hand = state.zones.find(
        (z) => z.kind === 'hand' && z.ownerId === entry.casterId,
      );
      const valid = hiddenInTrash(state, entry.casterId);
      state = {
        ...state,
        cards: state.cards.map((c) =>
          hand && entry.selectedUnitIds?.includes(c.id) && valid.includes(c.id)
            ? { ...c, zoneId: hand.id }
            : c,
        ),
        freeHidePlayers: [...(state.freeHidePlayers ?? []), entry.casterId],
      };
      continue;
    }
    if (effect.type === 'empower-buffs') {
      state = {
        ...state,
        buffBonus: {
          ...state.buffBonus,
          [entry.casterId]:
            (state.buffBonus?.[entry.casterId] ?? 0) + effect.amount,
        },
      };
      continue;
    }
    if (effect.type === 'kill-selected-total-might') {
      if (!validMightBundle(state, entry.selectedUnitIds, effect.maximum))
        continue;
      const killed = settleLethalUnits(state, new Set(entry.selectedUnitIds));
      state = killed.state;
      events.push(...killed.events);
      continue;
    }
    if (effect.type === 'damage-instances') {
      for (const id of entry.selectedUnitIds ?? []) {
        const unit = state.units.find((u) => u.id === id);
        if (!unit) continue;
        const damaged = dealSpellDamage(
          state,
          entry.card.id,
          entry.casterId,
          [unit],
          effect.amount,
        );
        state = damaged.state;
        events.push(...damaged.events);
      }
      continue;
    }
    if (effect.type === 'steal-top-card') {
      const opponent = state.players.find((p) => p.id !== entry.casterId);
      const top = state.cards.find((c) =>
        state.zones.some(
          (z) =>
            z.id === c.zoneId &&
            z.kind === 'deck' &&
            z.ownerId === opponent?.id,
        ),
      );
      const banished = state.zones.find(
        (z) => z.kind === 'banished' && z.ownerId === top?.ownerId,
      );
      if (!top || !banished) continue;
      state = {
        ...state,
        cards: state.cards.map((c) =>
          c.id === top.id ? { ...c, zoneId: banished.id } : c,
        ),
      };
      const unit = state.unitDefinitions?.find(
        (d) => d.id === top.definitionId,
      );
      const spell = state.spellDefinitions?.find(
        (d) => d.id === top.definitionId,
      );
      const base = state.zones.find(
        (z) => z.kind === 'base' && z.ownerId === entry.casterId,
      );
      if (unit && base) {
        state = {
          ...state,
          cards: state.cards.filter((c) => c.id !== top.id),
          units: [
            ...state.units,
            {
              id: top.id,
              definitionId: top.definitionId,
              ownerId: entry.casterId,
              cardOwnerId: top.ownerId,
              zoneId: base.id,
              ready: unit.entersReady === true,
              might: unit.might,
              ...(unit.tank ? { tank: true } : {}),
              ...(unit.backline ? { backline: true } : {}),
              damage: 0,
            },
          ],
        };
        events.push({
          type: 'unit-played',
          playerId: entry.casterId,
          unitId: top.id,
          definitionId: unit.id,
          zoneId: base.id,
        });
      } else if (spell?.target.kind === 'caster' && state.stack) {
        state = {
          ...state,
          cards: state.cards.filter((c) => c.id !== top.id),
          stack: {
            ...state.stack,
            entries: [
              ...state.stack.entries,
              {
                card: { ...top, zoneId: banished.id },
                definition: spell,
                casterId: entry.casterId,
                targetId: entry.casterId,
              },
            ],
          },
        };
      }
      continue;
    }
    if (effect.type === 'steal-spell') {
      const stolen = stackSpellTarget(state, entry.definition, entry.targetId);
      if (!stolen || !state.stack) continue;
      state = {
        ...state,
        stack: {
          ...state.stack,
          entries: state.stack.entries.map((e) =>
            e === stolen ? { ...stolen, casterId: entry.casterId } : e,
          ),
        },
      };
      // « You may make new choices » : nouvelle cible principale au choix du voleur.
      const kind = stolen.definition.target.kind;
      const options =
        kind === 'unit'
          ? state.units
              .filter((u) =>
                spellTarget(state, stolen.definition, u.id, entry.casterId),
              )
              .map((u) => u.id)
          : kind === 'battlefield'
            ? state.battlefields
                .map((f) => f.zoneId)
                .filter((id) => validBattlefieldTarget(state, id))
            : [];
      const others = options.filter((id) => id !== stolen.targetId);
      if (others.length)
        state = {
          ...state,
          pendingModeChoice: {
            kind: 'mode-choice',
            sourceId: entry.card.id,
            ownerId: entry.casterId,
            modes: ['skip', ...others.map((id) => `retarget:${id}` as const)],
            retargetSpellId: stolen.card.id,
          },
        };
      continue;
    }
    if (effect.type === 'counter-spell') {
      const countered = stackSpellTarget(
        state,
        entry.definition,
        entry.targetId,
      );
      if (!countered || !state.stack) continue;
      const grave = state.zones.find(
        (z) => z.ownerId === countered.card.ownerId && z.kind === 'graveyard',
      );
      if (!grave) throw new Error('Cimetière absent pour le sort contré.');
      state = {
        ...state,
        stack: {
          ...state.stack,
          entries: state.stack.entries.filter((e) => e !== countered),
        },
        cards: [...state.cards, { ...countered.card, zoneId: grave.id }],
      };
      events.push({
        type: 'spell-countered',
        cardId: countered.card.id,
        playerId: countered.casterId,
        sourceId: entry.card.id,
      });
      continue;
    }
    if (effect.type === 'discard-hands-then-draw') {
      const graveOf = (ownerId: string) =>
        state.zones.find((z) => z.kind === 'graveyard' && z.ownerId === ownerId)
          ?.id;
      const discarded = state.cards.filter((c) =>
        state.zones.some(
          (z) =>
            z.id === c.zoneId && z.kind === 'hand' && z.ownerId === c.ownerId,
        ),
      );
      state = {
        ...state,
        cards: state.cards.map((c) =>
          discarded.includes(c)
            ? { ...c, zoneId: graveOf(c.ownerId) ?? c.zoneId }
            : c,
        ),
      };
      events.push(
        ...discarded.map((c) => ({
          type: 'card-discarded' as const,
          playerId: c.ownerId,
          cardId: c.id,
        })),
      );
      const order = [
        entry.casterId,
        ...state.players.map((p) => p.id).filter((id) => id !== entry.casterId),
      ];
      for (const playerId of order)
        for (let i = 0; i < effect.count && !state.result; i++) {
          const drawn = drawCardForPlayer(state, playerId);
          state = drawn.state;
          events.push(...drawn.events);
        }
      continue;
    }
    if (effect.type === 'grant-temporary') {
      if (!battlefieldUnitOrGear(state, entry.targetId)) continue;
      state = {
        ...state,
        units: state.units.map((u) =>
          u.id === entry.targetId ? { ...u, temporary: true } : u,
        ),
        ...(state.gears
          ? {
              gears: state.gears.map((g) =>
                g.id === entry.targetId ? { ...g, temporary: true } : g,
              ),
            }
          : {}),
      };
      continue;
    }
    if (effect.type === 'kill-target-gear') {
      const killed = killGears(state, [entry.targetId]);
      state = killed.state;
      events.push(...killed.events);
      continue;
    }
    if (effect.type === 'look-pick') {
      state = startPick(state, entry.casterId, entry.card.id, effect.count);
      continue;
    }
    if (effect.type === 'damage-kills-this-turn') {
      state = {
        ...state,
        damageBaseline: Object.fromEntries(
          state.units.map((u) => [u.id, u.damage]),
        ),
      };
      continue;
    }
    if (effect.type === 'prevent-effect-damage') {
      state = { ...state, effectDamagePrevented: true };
      continue;
    }
    if (effect.type === 'kill-all-gear') {
      const killed = killGears(
        state,
        (state.gears ?? []).map((g) => g.id),
      );
      state = killed.state;
      events.push(...killed.events);
      continue;
    }
    if (effect.type === 'exhaust-allies') {
      state = {
        ...state,
        units: state.units.map((u) =>
          u.ownerId === entry.casterId ? { ...u, ready: false } : u,
        ),
      };
      continue;
    }
    if (
      effect.type === 'damage-enemies-at-battlefield' ||
      effect.type === 'damage-enemies-at-battlefield-x' ||
      effect.type === 'damage-enemies-in-combat'
    ) {
      const fieldId =
        effect.type === 'damage-enemies-in-combat'
          ? state.showdown?.kind === 'combat'
            ? state.showdown.battlefieldId
            : undefined
          : entry.targetId;
      if (!fieldId || !validBattlefieldTarget(state, fieldId)) continue;
      const areas = getBattlefieldSides(state, fieldId).filter(
        (side) => side.playerId !== entry.casterId,
      );
      const damaged = dealAreaDamage(
        state,
        { kind: 'spell', cardId: entry.card.id, playerId: entry.casterId },
        areas,
        effect.type === 'damage-enemies-at-battlefield-x'
          ? (entry.xPower ?? 0)
          : effect.amount,
      );
      state = damaged.state;
      events.push(...damaged.events);
      continue;
    }
    const target = spellTarget(
      state,
      entry.definition,
      entry.targetId,
      entry.casterId,
    );
    // Deflect refusé : l'effet visant cette unité fizzle.
    if (!target || entry.fizzledIds?.includes(target.id)) continue;
    if (effect.type === 'return-unit-to-hand') {
      const left = leaveBoard(state, target, 'hand');
      state = left.state;
      events.push(...left.events);
    } else if (effect.type === 'discard-for-damage') {
      // Carte choisie par le lanceur à la résolution ; main vide : rien.
      const hand = state.cards.filter((c) =>
        state.zones.some(
          (z) =>
            z.id === c.zoneId &&
            z.kind === 'hand' &&
            z.ownerId === entry.casterId,
        ),
      );
      if (hand.length)
        state = {
          ...state,
          pendingModeChoice: {
            kind: 'mode-choice',
            sourceId: entry.card.id,
            ownerId: entry.casterId,
            modes: hand.map((c) => `discard-dmg:${c.id}` as const),
            discardDamageTarget: target.id,
          },
        };
    } else if (effect.type === 'kill-unit') {
      const killed = settleLethalUnits(state, new Set([target.id]));
      state = killed.state;
      events.push(...killed.events);
      for (let i = 0; i < (effect.controllerDraws ?? 0) && !state.result; i++) {
        const drawn = drawCardForPlayer(state, target.ownerId);
        state = drawn.state;
        events.push(...drawn.events);
      }
    } else if (effect.type === 'strike') {
      const enemy = secondaryEnemyTarget(
        state,
        entry.definition,
        entry.casterId,
        entry.secondaryTargetId,
      );
      if (!enemy) continue;
      const amount =
        target.cannotDealDamage || state.effectDamagePrevented
          ? 0
          : effectiveMight(target, state);
      state = {
        ...state,
        units: state.units.map((u) =>
          u.id === enemy.id && !preventsDamage(u, state)
            ? { ...u, damage: u.damage + amount }
            : u,
        ),
      };
      events.push({
        type: 'unit-damage',
        context: 'strike',
        sourceId: target.id,
        unitId: enemy.id,
        amount,
      });
    } else if (effect.type === 'duel') {
      const enemy = duelEnemyTarget(
        state,
        entry.casterId,
        entry.secondaryTargetId,
      );
      if (!enemy) continue;
      const duel = resolveDuel(state, target, enemy);
      state = duel.state;
      events.push(...duel.events);
    } else if (effect.type === 'damage') {
      const damaged = dealSpellDamage(
        state,
        entry.card.id,
        entry.casterId,
        [target],
        effect.amount,
      );
      state = damaged.state;
      events.push(...damaged.events);
      if (effect.drawIfKilled) {
        const settled = settleLethalUnits(state);
        state = settled.state;
        events.push(...settled.events);
        if (
          settled.events.some(
            (e) =>
              (e.type === 'unit-died' || e.type === 'token-removed') &&
              e.unitId === target.id,
          )
        )
          for (let i = 0; i < effect.drawIfKilled && !state.result; i++) {
            const drawn = drawCardForPlayer(state, entry.casterId);
            state = drawn.state;
            events.push(...drawn.events);
          }
      }
    } else if (effect.type === 'damage-unless-draw') {
      state = {
        ...state,
        pendingModeChoice: {
          kind: 'mode-choice',
          sourceId: entry.card.id,
          ownerId: target.ownerId,
          partnerId: entry.casterId,
          sufferAmount: effect.amount,
          partnerDraws: effect.draw,
          modes: [`suffer:${target.id}`, 'let-draw'],
        },
      };
    } else if (effect.type === 'banish-replay') {
      const banished = leaveBoard(state, target, 'banished');
      state = banished.state;
      events.push(...banished.events);
      const card = state.cards.find((c) => c.id === target.id);
      const unit = state.unitDefinitions?.find(
        (d) => d.id === card?.definitionId,
      );
      const base = state.zones.find(
        (z) => z.kind === 'base' && z.ownerId === card?.ownerId,
      );
      if (!card || !unit || !base) continue;
      state = {
        ...state,
        cards: state.cards.filter((c) => c.id !== card.id),
        units: [
          ...state.units,
          {
            id: card.id,
            definitionId: card.definitionId,
            ownerId: card.ownerId,
            zoneId: base.id,
            ready: unit.entersReady === true,
            might: unit.might,
            ...(unit.tank ? { tank: true } : {}),
            ...(unit.backline ? { backline: true } : {}),
            damage: 0,
          },
        ],
      };
      events.push({
        type: 'unit-played',
        playerId: card.ownerId,
        unitId: card.id,
        definitionId: unit.id,
        zoneId: base.id,
      });
    } else if (effect.type === 'steal-and-recall') {
      const base = state.zones.find(
        (z) => z.kind === 'base' && z.ownerId === entry.casterId,
      );
      if (!base) continue;
      const units = state.units.map((u) =>
        u.id === target.id
          ? {
              ...u,
              cardOwnerId: u.cardOwnerId ?? u.ownerId,
              ownerId: entry.casterId,
              zoneId: base.id,
            }
          : u,
      );
      state = {
        ...state,
        units,
        battlefields: state.battlefields.map((f) =>
          f.zoneId !== state.showdown?.battlefieldId &&
          !units.some(
            (u) => u.zoneId === f.zoneId && u.ownerId === f.controllerId,
          )
            ? { ...f, controllerId: null }
            : f,
        ),
      };
    } else if (effect.type === 'grant-shield-tank') {
      state = {
        ...state,
        units: state.units.map((u) =>
          u.id === target.id
            ? {
                ...u,
                temporaryEffects: [
                  ...(u.temporaryEffects ?? []),
                  { type: 'shield' as const, amount: effect.shield },
                  { type: 'tank' as const },
                ],
              }
            : u,
        ),
      };
    } else if (effect.type === 'ready-unit') {
      if (
        target.ownerId !== entry.casterId &&
        wardenAgainst(state, target.ownerId)
      )
        continue;
      state = {
        ...state,
        units: state.units.map((u) =>
          u.id === target.id ? { ...u, ready: true } : u,
        ),
      };
    } else if (effect.type === 'might-damage-enemies-then-move') {
      const fieldId = entry.destinationId ?? '';
      if (!validBattlefieldTarget(state, fieldId)) continue;
      const damaged = dealAreaDamage(
        state,
        { kind: 'spell', cardId: entry.card.id, playerId: entry.casterId },
        getBattlefieldSides(state, fieldId).filter(
          (side) => side.playerId !== entry.casterId,
        ),
        effectiveMight(target, state),
      );
      state = damaged.state;
      events.push(...damaged.events);
      const mover = state.units.find((u) => u.id === target.id);
      if (!mover) continue;
      const moved = moveUnit(state, mover, fieldId);
      state = moved.state;
      events.push(...moved.events);
    } else if (effect.type === 'buff-unit') {
      state = buffUnit(state, target.id);
    } else if (effect.type === 'move-to-battlefield') {
      const mover = state.units.find((u) => u.id === target.id);
      if (!mover || !validBattlefieldTarget(state, entry.destinationId ?? ''))
        continue;
      const moved = moveUnit(state, mover, entry.destinationId!);
      state = moved.state;
      events.push(...moved.events);
    } else if (effect.type === 'fight-at-destination') {
      const mover = state.units.find((u) => u.id === target.id);
      const foe = destinationFoe(
        state,
        entry.casterId,
        target.id,
        mover?.zoneId,
        entry.secondaryTargetId,
      );
      if (!mover || !foe || mover.zoneId !== entry.destinationId) continue;
      const fought = resolveDuel(state, mover, foe);
      state = fought.state;
      events.push(...fought.events);
    } else if (effect.type === 'guillotine') {
      if ((state.cardsPlayedThisTurn?.[entry.casterId] ?? 0) >= 2) {
        const killed = settleLethalUnits(state, new Set([target.id]));
        state = killed.state;
        events.push(...killed.events);
      } else
        state = {
          ...state,
          units: state.units.map((u) =>
            u.id === target.id ? { ...u, killOnDamageAbove: u.damage } : u,
          ),
        };
    } else if (effect.type === 'double-might-temporary') {
      const amount = effectiveMight(target, state);
      state = {
        ...state,
        units: state.units.map((u) =>
          u.id === target.id
            ? {
                ...u,
                temporary: true,
                temporaryEffects: [
                  ...(u.temporaryEffects ?? []),
                  { type: 'modify-might' as const, amount },
                ],
              }
            : u,
        ),
      };
    } else if (effect.type === 'match-ally-might') {
      const other = otherAlly(
        state,
        entry.casterId,
        target.id,
        entry.secondaryTargetId,
      );
      if (!other) continue;
      const amount = Math.max(
        0,
        effectiveMight(other, state) - effectiveMight(target, state),
      );
      state = {
        ...state,
        units: state.units.map((u) =>
          u.id === target.id
            ? {
                ...u,
                temporaryEffects: [
                  ...(u.temporaryEffects ?? []),
                  { type: 'modify-might' as const, amount },
                ],
              }
            : u,
        ),
      };
    } else if (effect.type === 'stun-with-enemy-here') {
      const foe = enemyHere(
        state,
        entry.casterId,
        target,
        entry.secondaryTargetId,
      );
      const stunned = new Set([target.id, ...(foe ? [foe.id] : [])]);
      state = {
        ...state,
        units: state.units.map((u) =>
          stunned.has(u.id)
            ? {
                ...u,
                temporaryEffects: [
                  ...(u.temporaryEffects ?? []),
                  { type: 'stun' as const, byPlayerId: entry.casterId },
                ],
              }
            : u,
        ),
      };
    } else if (effect.type === 'move-ally-to-target') {
      const ally = allyToMove(
        state,
        entry.casterId,
        target,
        entry.secondaryTargetId,
      );
      if (!ally) continue;
      const moved = moveUnit(state, ally, target.zoneId);
      state = moved.state;
      events.push(...moved.events);
    } else if (effect.type === 'move-unit') {
      if (
        !validDestination(state, target, entry.destinationId, effect.baseOnly)
      )
        continue;
      const moved = moveUnit(state, target, entry.destinationId!);
      state = moved.state;
      events.push(...moved.events);
    } else {
      const modifier =
        effect.type === 'modify-might'
          ? {
              type: 'modify-might' as const,
              amount:
                effect.minimum === undefined
                  ? effect.amount +
                    (state.units.filter(
                      (u) =>
                        u.ownerId === target.ownerId &&
                        u.zoneId === target.zoneId,
                    ).length === 1
                      ? (effect.aloneBonus ?? 0)
                      : 0)
                  : Math.max(
                      effect.amount,
                      Math.min(
                        0,
                        effect.minimum - effectiveMight(target, state),
                      ),
                    ),
            }
          : effect.type === 'grant-assault'
            ? { type: 'assault' as const, amount: effect.amount }
            : effect.type === 'stun'
              ? { type: 'stun' as const, byPlayerId: entry.casterId }
              : { type: effect.type };
      state = {
        ...state,
        units: state.units.map((u) =>
          u.id === target.id
            ? {
                ...u,
                temporaryEffects: [...(u.temporaryEffects ?? []), modifier],
              }
            : u,
        ),
      };
    }
  }
  const grave = state.zones.find(
    (z) =>
      z.ownerId === entry.card.ownerId &&
      z.kind ===
        (entry.recycleOnResolve
          ? 'deck'
          : entry.definition.banishOnResolve
            ? 'banished'
            : 'graveyard'),
  );
  if (!grave) throw new Error('Cimetière absent pour le sort résolu.');
  state = {
    ...state,
    cards: [...state.cards, { ...entry.card, zoneId: grave.id }],
  };
  events.push({
    type: 'spell-resolved',
    playerId: entry.casterId,
    cardId: entry.card.id,
    targetId: entry.targetId,
  });
  const settled = settleLethalUnits(state);
  return { ...settled, events: [...events, ...settled.events] };
}

/** Déplacement par sort : unité -> zone, contrôle des champs abandonnés recalculé (hors
 * champ du showdown) et showdown en attente sur un autre champ atteint. */
export function moveUnit(
  input: GameState,
  target: UnitState,
  destinationId: string,
): { state: GameState; events: GameEvent[] } {
  let state = input;
  const events: GameEvent[] = [];
  state = {
    ...state,
    units: state.units.map((u) =>
      u.id === target.id ? { ...u, zoneId: destinationId } : u,
    ),
  };
  state = {
    ...state,
    battlefields: state.battlefields.map((f) =>
      f.zoneId !== state.showdown?.battlefieldId &&
      !state.units.some(
        (u) => u.zoneId === f.zoneId && u.ownerId === f.controllerId,
      )
        ? { ...f, controllerId: null }
        : f,
    ),
  };
  if (
    destinationId !== target.zoneId &&
    state.battlefields.some((f) => f.zoneId === destinationId) &&
    destinationId !== state.showdown?.battlefieldId
  ) {
    state = {
      ...state,
      pendingShowdowns: [
        ...(state.pendingShowdowns ?? []),
        { battlefieldId: destinationId, initiatorId: target.ownerId },
      ],
    };
  }
  events.push({
    type: 'unit-moved',
    unitId: target.id,
    from: target.zoneId,
    to: destinationId,
  });
  return { state, events };
}

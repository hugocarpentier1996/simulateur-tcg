import type { GameState, GameAction, ActionResult } from './types.js';
import { moveUnit } from './actions/move.js';
import { passPriority } from './actions/pass.js';
import { endTurn } from './actions/end-turn.js';
import { playUnit } from './actions/play-unit.js';
import { assignDamage } from './actions/assign-damage.js';
import { castSpell } from './actions/cast-spell.js';
import { passStack } from './actions/pass-stack.js';
import { afterEffects } from './showdown/after-effects.js';
import { chooseFirstPlayer } from './setup/choose-first.js';
import { mulligan } from './setup/mulligan.js';
import { chooseBattlefield } from './setup/battlefields.js';
import { playGear } from './actions/play-gear.js';
import { equipGear } from './actions/equip-gear.js';
import { syncAttachments } from './effects/attachments.js';
import { queueDeathEffects } from './effects/death.js';
import { settleLethalUnits } from './effects/lethal-units.js';

/**
 * Point d'entrée du moteur : état courant + intention -> résultat de l'action.
 *
 * @param state État cohérent de la partie avant l'action, non modifié par cet appel.
 * @param action Intention typée à vérifier puis appliquer.
 * @returns Refus explicite, ou nouvel état accompagné de ses événements :
 * - move accepté : unité déplacée/Tap, Showdown ouvert si nécessaire, événements
 *   `unit-moved` puis `showdown-opened`.
 * - première passe : priorité au participant suivant, événement `priority-passed`.
 * - dernière passe en Open : Showdown fermé, contrôle attribué à l'initiateur, événements
 *   `priority-passed`, `battlefield-conquered`, puis `point-scored` si le champ
 *   n'a pas déjà donné de point à ce joueur pendant ce tour.
 * - end-turn : fin du tour puis étapes automatiques jusqu'à la Main du suivant ;
 *   événements de phase, de ressources, de tenue, de runes et de pioche ordonnés.
 * - play-unit : paiement complet et unité Tap en base, ou refus sans changement.
 * - assign-damage : choix enregistré, puis résolution simultanée après les deux choix.
 *
 * Même état + même action = même résultat, sans effet réseau ni horloge implicite.
 * Les parties inchangées de l'état peuvent partager leurs objets avec l'entrée :
 * traiter les états comme des instantanés et éviter de les modifier après un appel.
 * Un gain autorisé atteignant le seuil termine la partie ; une conquête finale
 * inéligible est remplacée par une pioche, avec le champ inscrit comme scoré.
 */
export function act(state: GameState, action: GameAction): ActionResult {
  const result = dispatch(state, action);
  if (!result.ok) return result;
  const settled = settleLethalUnits(result.state);
  const attached = syncAttachments(settled.state);
  const next = afterEffects(attached.state);
  const events = [...result.events, ...settled.events, ...attached.events];
  const opened = !result.state.showdown && next.showdown;
  return {
    ...result,
    state: next,
    events: opened
      ? [
          ...events,
          { type: 'showdown-opened', battlefieldId: opened.battlefieldId },
        ]
      : events,
  };
}

function dispatch(state: GameState, action: GameAction): ActionResult {
  if (state.result) return { ok: false, reason: 'GAME_OVER' };
  if (!state.players.some((player) => player.id === action.playerId)) {
    return { ok: false, reason: 'UNKNOWN_PLAYER' };
  }
  if (action.type === 'queue-death-effects')
    return queueDeathEffects(state, action);
  if (state.pendingDeaths)
    return { ok: false, reason: 'DEATH_CHOICES_REQUIRED' };

  if (action.type === 'choose-battlefield')
    return chooseBattlefield(state, action);
  if (action.type === 'choose-first-player')
    return chooseFirstPlayer(state, action);
  if (action.type === 'mulligan') return mulligan(state, action);
  if (state.setup || state.phase === 'setup')
    return { ok: false, reason: 'SETUP_IN_PROGRESS' };
  if (state.stack && action.type !== 'cast-spell' && action.type !== 'pass')
    return { ok: false, reason: 'STACK_IN_PROGRESS' };
  if (
    !state.stack &&
    !state.showdown &&
    state.priorityPlayerId &&
    state.priorityPlayerId !== action.playerId
  )
    return { ok: false, reason: 'NO_PRIORITY' };
  switch (action.type) {
    case 'play-gear':
      return playGear(state, action);
    case 'equip-gear':
      return equipGear(state, action);
    case 'cast-spell':
      return castSpell(state, action);
    case 'play-unit':
      return playUnit(state, action);
    case 'assign-damage':
      return assignDamage(state, action);
    case 'move':
      return moveUnit(state, action);
    case 'pass':
      if (state.stack) return passStack(state, action.playerId);
      if (
        !state.showdown &&
        state.priorityPlayerId === action.playerId &&
        action.playerId !== state.activePlayerId
      )
        return {
          ok: true,
          state: { ...state, priorityPlayerId: state.activePlayerId },
          events: [{ type: 'priority-passed', playerId: action.playerId }],
        };
      return passPriority(state, action);
    case 'end-turn':
      return endTurn(state, action);
    default: {
      // TypeScript signale ici tout nouveau type d'action sans traitement associé.
      const unhandled: never = action;
      return unhandled;
    }
  }
}

import {
  createDemo,
  dispatch,
  boardOptions,
  playOrMove,
  undo,
  passShowdown,
} from './session.js';
import { renderTable, type Selection } from './view.js';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#app')!;
let session = createDemo();
let selection: Selection | null = null;
let suppressClick = false;

function render() {
  const focusId = document.activeElement?.id;
  root.innerHTML = renderTable(session, selection);
  if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
}

function place(destinationId: string) {
  if (!selection) return;
  session = playOrMove(session, selection.cardId, destinationId);
  if (!session.error) selection = null;
  render();
}

root.addEventListener('click', (event) => {
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  const target = event.target as HTMLElement;
  const zone = target.closest<HTMLElement>('[data-zone]');
  if (zone && selection && !target.closest('[data-card]')) {
    place(zone.dataset.zone!);
    return;
  }
  const button = target.closest<HTMLButtonElement>('button');
  if (!button) return;
  if (button.dataset.card) {
    selection = { cardId: button.dataset.card };
    session = { ...session, error: null };
  } else if (button.dataset.action === 'pass') {
    session = passShowdown(session);
    selection = null;
  } else if (button.dataset.action === 'undo') {
    session = undo(session);
    selection = null;
  } else if (button.dataset.action === 'cancel') selection = null;
  else if (button.dataset.action === 'end') {
    session = dispatch(session, {
      type: 'end-turn',
      playerId: session.state.activePlayerId,
    });
    if (!session.error) selection = null;
  } else if (button.dataset.action === 'reset') {
    if (
      !window.confirm(
        'Recommencer la partie de test ? La partie actuelle sera effacée.',
      )
    )
      return;
    session = createDemo();
    selection = null;
  } else return;
  render();
});

// Le pointeur unifie souris et tactile ; le clic reste une alternative au déplacement.
let gesture: {
  cardId: string;
  x: number;
  y: number;
  source: HTMLElement;
  ghost: HTMLElement | null;
  targets: string[];
} | null = null;
root.addEventListener('dragstart', (event) => event.preventDefault());
root.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  suppressClick = false;
  const source = (event.target as HTMLElement).closest<HTMLElement>(
    '[data-card]',
  );
  if (!source) return;
  const cardId = source.dataset.card!;
  gesture = {
    cardId,
    x: event.clientX,
    y: event.clientY,
    source,
    ghost: null,
    targets: boardOptions(session.state, cardId).map((a) => a.destinationId!),
  };
});
root.addEventListener('pointermove', (event) => {
  if (!gesture || !gesture.targets.length) return;
  if (
    !gesture.ghost &&
    Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 7
  )
    return;
  event.preventDefault();
  if (!gesture.ghost) {
    root.setPointerCapture(event.pointerId);
    selection = { cardId: gesture.cardId };
    gesture.ghost = gesture.source.cloneNode(true) as HTMLElement;
    gesture.ghost.removeAttribute('id');
    gesture.ghost.removeAttribute('data-card');
    gesture.ghost.className = 'card drag-ghost';
    gesture.ghost.setAttribute('aria-hidden', 'true');
    document.body.append(gesture.ghost);
    root
      .querySelectorAll<HTMLElement>('[data-zone]')
      .forEach((zone) =>
        zone.classList.toggle(
          'drop-target',
          gesture!.targets.includes(zone.dataset.zone!),
        ),
      );
  }
  gesture.ghost.style.left = event.clientX - 65 + 'px';
  gesture.ghost.style.top = event.clientY - 35 + 'px';
});
root.addEventListener('pointerup', (event) => {
  if (!gesture) return;
  const moved = !!gesture.ghost;
  gesture.ghost?.remove();
  gesture = null;
  if (!moved) return;
  suppressClick = true;
  if (root.hasPointerCapture(event.pointerId))
    root.releasePointerCapture(event.pointerId);
  const zone = document
    .elementFromPoint(event.clientX, event.clientY)
    ?.closest<HTMLElement>('[data-zone]');
  if (zone) place(zone.dataset.zone!);
  else render();
});
root.addEventListener('pointercancel', () => {
  gesture?.ghost?.remove();
  gesture = null;
  render();
});

render();

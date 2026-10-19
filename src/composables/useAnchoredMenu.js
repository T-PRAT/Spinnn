import { ref, computed, nextTick, onBeforeUnmount, toValue } from 'vue';

// Distance minimale entre le menu et le bord de l'écran, et entre le menu et son bouton
const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 8;

/**
 * Menu flottant ancré à un bouton.
 *
 * Le menu est affiché en `position: fixed` : il faut le téléporter dans <body> (<Teleport>)
 * pour qu'un parent en `overflow: hidden` ou avec son propre contexte d'empilement ne le coupe
 * pas. Le composable calcule la position (recalée dans l'écran, retournée si la place manque
 * du côté demandé), gère la fermeture (clic extérieur, Échap, Tab, défilement, redimensionnement)
 * et le focus (premier élément à l'ouverture, retour au bouton à la fermeture au clavier).
 *
 * @param {object} options
 * @param {import('vue').Ref<HTMLElement|null>} options.triggerRef - Bouton qui ouvre le menu
 * @param {import('vue').Ref<HTMLElement|null>} options.menuRef - Élément racine du menu
 * @param {'top'|'bottom'|import('vue').Ref|Function} [options.placement] - Côté préféré
 * @param {'start'|'center'|'end'|import('vue').Ref|Function} [options.align] - Alignement horizontal
 */
export function useAnchoredMenu({ triggerRef, menuRef, placement = 'bottom', align = 'center' }) {
  const isOpen = ref(false);
  // Null tant que le menu n'est pas mesuré : il reste alors invisible, sans clignotement
  const position = ref(null);

  const menuStyle = computed(() =>
    position.value
      ? { left: `${position.value.left}px`, top: `${position.value.top}px` }
      : { left: '0px', top: '0px', visibility: 'hidden' }
  );

  function updatePosition() {
    const trigger = triggerRef.value;
    const menu = menuRef.value;
    if (!trigger || !menu) return;

    const anchor = trigger.getBoundingClientRect();
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;

    const alignment = toValue(align);
    let left;
    if (alignment === 'start') left = anchor.left;
    else if (alignment === 'end') left = anchor.right - width;
    else left = anchor.left + anchor.width / 2 - width / 2;
    left = Math.min(window.innerWidth - width - VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, left));

    const spaceBelow = window.innerHeight - anchor.bottom - TRIGGER_GAP - VIEWPORT_MARGIN;
    const spaceAbove = anchor.top - TRIGGER_GAP - VIEWPORT_MARGIN;
    let side = toValue(placement);
    if (side === 'bottom' && height > spaceBelow && spaceAbove > spaceBelow) side = 'top';
    else if (side === 'top' && height > spaceAbove && spaceBelow > spaceAbove) side = 'bottom';

    let top = side === 'bottom' ? anchor.bottom + TRIGGER_GAP : anchor.top - TRIGGER_GAP - height;
    top = Math.min(window.innerHeight - height - VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, top));

    position.value = { left: Math.round(left), top: Math.round(top) };
  }

  function focusInitialItem() {
    const menu = menuRef.value;
    if (!menu) return;
    const target =
      menu.querySelector('[aria-checked="true"], [aria-current="true"]') ??
      menu.querySelector('button:not([disabled])');
    target?.focus({ preventScroll: true });
  }

  function onPointerDown(event) {
    if (triggerRef.value?.contains(event.target) || menuRef.value?.contains(event.target)) return;
    close();
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') close(true);
    else if (event.key === 'Tab') close();
  }

  // Le menu est téléporté ailleurs dans le DOM : le défilement d'un autre élément le désancrerait
  function onScroll(event) {
    if (menuRef.value?.contains(event.target)) return;
    close();
  }

  function addListeners() {
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
  }

  function removeListeners() {
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scroll', onScroll, true);
  }

  function onResize() {
    close();
  }

  async function open() {
    if (isOpen.value) return;
    position.value = null;
    isOpen.value = true;

    await nextTick();
    if (!isOpen.value) return;
    updatePosition();
    addListeners();
    focusInitialItem();
  }

  /**
   * @param {boolean} [restoreFocus] - Rend le focus au bouton (fermeture au clavier ou après un choix)
   */
  function close(restoreFocus = false) {
    if (!isOpen.value) return;
    isOpen.value = false;
    position.value = null;
    removeListeners();
    if (restoreFocus) triggerRef.value?.focus({ preventScroll: true });
  }

  function toggle() {
    if (isOpen.value) close();
    else open();
  }

  /** Navigation aux flèches entre les boutons du menu (à brancher sur @keydown du menu) */
  function onMenuKeydown(event) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

    const items = [...(menuRef.value?.querySelectorAll('button:not([disabled])') ?? [])];
    if (items.length === 0) return;
    event.preventDefault();

    const current = items.indexOf(document.activeElement);
    let next;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else if (event.key === 'ArrowDown') next = (current + 1) % items.length;
    else next = (current - 1 + items.length) % items.length;
    items[next].focus();
  }

  onBeforeUnmount(removeListeners);

  return { isOpen, menuStyle, open, close, toggle, onMenuKeydown };
}

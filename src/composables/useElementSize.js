import { ref, onMounted, onBeforeUnmount } from 'vue';

/**
 * Taille réactive d'un élément (largeur et hauteur de sa zone de contenu, en px).
 * @param {import('vue').Ref<HTMLElement|null>} target - Référence template de l'élément mesuré
 */
export function useElementSize(target) {
  const width = ref(0);
  const height = ref(0);
  let observer = null;

  onMounted(() => {
    const element = target.value;
    if (!element) return;

    // Première mesure synchrone (zone de contenu, comme ResizeObserver) : évite un premier
    // rendu à taille nulle puis un saut quand l'observateur répond
    const style = getComputedStyle(element);
    width.value = Math.round(
      element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    );
    height.value = Math.round(
      element.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
    );

    observer = new ResizeObserver(([entry]) => {
      width.value = Math.round(entry.contentRect.width);
      height.value = Math.round(entry.contentRect.height);
    });
    observer.observe(element);
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    observer = null;
  });

  return { width, height };
}

<script setup>
import { ref, onMounted, onBeforeUnmount, useId } from 'vue';
import { useI18n } from '@/composables/useI18n';
defineProps({ title: String });
const emit = defineEmits(['close']);
const dialog = ref(null), titleId = useId();
const { t } = useI18n();
let previousFocus;
onMounted(() => { previousFocus = document.activeElement; dialog.value.showModal(); });
onBeforeUnmount(() => { dialog.value?.close(); previousFocus?.focus(); });
</script>
<template>
  <Teleport to="body">
    <dialog ref="dialog" :aria-labelledby="titleId" @cancel.prevent="emit('close')" @click="event => { if (event.target === dialog) emit('close'); }" class="app-dialog">
      <div class="p-5 space-y-4">
        <header class="flex justify-between items-center gap-4">
          <h2 :id="titleId" class="font-bold text-lg">{{ title }}</h2>
          <button class="touch-button" :aria-label="t('common.buttons.close')" @click="emit('close')">×</button>
        </header>
        <slot />
      </div>
    </dialog>
  </Teleport>
</template>

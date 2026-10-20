<script setup>
import { ref, computed } from "vue";
import { useI18n } from "@/composables/useI18n";
import { parseZwo, ZWO_MAX_BYTES } from "@/utils/zwoParser";
import { PreparationError, describePreparationError, preparationText } from "@/utils/preparationMessages";
import { formatSpan } from "@/utils/workoutBlocks";

const emit = defineEmits(["workout-selected"]);
const { currentLocale } = useI18n();

const fileInput = ref(null);
const importError = ref(null);
const imported = ref(null);

const errorMessage = computed(() => (importError.value ? describePreparationError(importError.value, currentLocale.value) : ""));
const retryHint = computed(() => preparationText("zwo.retryHint", {}, currentLocale.value));
const importedMessage = computed(() =>
  imported.value
    ? preparationText("zwo.imported", { name: imported.value.name, duration: formatSpan(imported.value.duration) }, currentLocale.value)
    : ""
);

async function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  importError.value = null;
  imported.value = null;

  try {
    if (file.size > ZWO_MAX_BYTES) {
      throw new PreparationError("zwo.tooLarge", { maxKb: Math.round(ZWO_MAX_BYTES / 1024) });
    }

    let text;
    try {
      text = await file.text();
    } catch {
      throw new PreparationError("zwo.unreadable");
    }

    const workout = parseZwo(text, { fallbackName: file.name.replace(/\.[^.]+$/, "") });
    imported.value = workout;
    emit("workout-selected", workout);
  } catch (error) {
    importError.value = error;
    if (!(error instanceof PreparationError)) console.error("ZWO import failed:", error);
  } finally {
    // Sans cela, choisir à nouveau le même fichier (corrigé entre-temps) ne déclencherait rien
    if (fileInput.value) fileInput.value.value = "";
  }
}
</script>

<template>
  <div class="space-y-2">
    <label class="block">
      <input
        ref="fileInput"
        type="file"
        accept=".zwo,application/xml,text/xml"
        @change="handleFileUpload"
        data-testid="zwo-input"
        class="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer file:transition-colors"
      />
    </label>

    <div v-if="importError" class="p-3 bg-destructive/10 rounded-lg border border-destructive/20 space-y-1" role="alert" data-testid="zwo-error">
      <p class="text-sm text-destructive">{{ errorMessage }}</p>
      <p class="text-xs text-muted-foreground">{{ retryHint }}</p>
    </div>

    <p v-else-if="imported" class="text-sm text-muted-foreground" role="status" data-testid="zwo-success">{{ importedMessage }}</p>
  </div>
</template>

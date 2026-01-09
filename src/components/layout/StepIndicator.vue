<script setup>
defineProps({
  currentStep: {
    type: Number,
    required: true
  }
});

const steps = [
  { number: 1, label: 'Configuration' },
  { number: 2, label: 'Entrainement' },
  { number: 3, label: 'Resume' }
];
</script>

<template>
  <div class="bg-card border-b border-border px-6 py-3">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between">
        <div
          v-for="(step, index) in steps"
          :key="step.number"
          class="flex items-center"
        >
          <div class="flex items-center">
            <div
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                currentStep === step.number
                  ? 'bg-primary text-primary-foreground'
                  : currentStep > step.number
                    ? 'bg-chart-3 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              ]"
            >
              <svg v-if="currentStep > step.number" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <span v-else>{{ step.number }}</span>
            </div>
            <span
              :class="[
                'ml-2 text-sm font-medium transition-colors',
                currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
              ]"
            >
              {{ step.label }}
            </span>
          </div>
          <div
            v-if="index < steps.length - 1"
            :class="[
              'w-16 h-0.5 mx-4 transition-colors',
              currentStep > step.number ? 'bg-chart-3' : 'bg-border'
            ]"
          />
        </div>
      </div>
    </div>
  </div>
</template>

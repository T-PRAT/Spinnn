<script setup>
import { computed } from "vue";
import WorkoutOverlays from "@/components/workout/WorkoutOverlays.vue";
import { getWorkoutLayoutComponent } from "@/components/workout/layouts";
import { useWorkoutController } from "@/composables/useWorkoutController";
import { useWorkoutLayout } from "@/composables/useWorkoutLayout";

// Une seule instance du contrôleur pour toute la séance : collecte des données, pilotage
// ERG et auto-pause continuent de tourner quel que soit le layout affiché. Changer de vue
// en pleine séance remplace seulement l'affichage.
const ctrl = useWorkoutController();
const { layoutId } = useWorkoutLayout();

const layout = computed(() => getWorkoutLayoutComponent(layoutId.value));
</script>

<template>
	<component :is="layout" :ctrl="ctrl" />
	<WorkoutOverlays :ctrl="ctrl" />
</template>

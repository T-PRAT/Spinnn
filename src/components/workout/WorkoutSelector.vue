<script setup>
import { ref } from "vue";
import { workoutCategories, formatDuration } from "../../data/sampleWorkouts";
import { useAppState } from "../../composables/useAppState";
import { useI18n } from "@/composables/useI18n";
import WorkoutPreviewChart from "./WorkoutPreviewChart.vue";

const appState = useAppState();
const { t } = useI18n();
const selectedWorkout = ref(null);
const expandedCategories = ref(new Set(["endurance"])); // First category open by default

const emit = defineEmits(["workout-selected"]);

function selectWorkout(workout) {
	selectedWorkout.value = workout;
	emit("workout-selected", workout);
}

function toggleCategory(categoryId) {
	if (expandedCategories.value.has(categoryId)) {
		expandedCategories.value.delete(categoryId);
	} else {
		// Close all other categories
		expandedCategories.value.clear();
		expandedCategories.value.add(categoryId);
	}
}
</script>

<template>
	<div class="space-y-4">
		<h2 class="text-xl font-bold text-foreground">
			{{ t('workout.predefined') }}
		</h2>

		<div class="h-92.5 max-h-150 overflow-y-auto space-y-3 pr-3">
			<div
				v-for="category in workoutCategories"
				:key="category.id"
				class="space-y-1.5"
			>
				<!-- En-tête de catégorie (cliquable pour plier/déplier) -->
				<button
					@click="toggleCategory(category.id)"
					class="w-full flex items-center justify-between p-2 bg-muted/50 hover:bg-muted rounded transition-colors"
				>
					<div class="flex items-center gap-2">
						<span class="text-lg">{{ category.icon }}</span>
						<span class="font-semibold text-sm text-foreground">{{
							category.name
						}}</span>
					</div>
					<svg
						:class="[
							'w-4 h-4 text-muted-foreground transition-transform',
							expandedCategories.has(category.id)
								? 'rotate-180'
								: '',
						]"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>

				<!-- Liste des entraînements de la catégorie -->
				<div
					v-if="expandedCategories.has(category.id)"
					class="space-y-1.5 pl-1"
				>
					<div
						v-for="workout in category.workouts"
						:key="workout.id"
						@click="selectWorkout(workout)"
						:class="[
							'p-2 border-2 rounded cursor-pointer transition-all',
							selectedWorkout?.id === workout.id
								? 'border-primary bg-primary/5'
								: 'border-border hover:border-primary/50 hover:bg-accent/50',
						]"
					>
						<WorkoutPreviewChart
							:ftp="appState.ftp.value"
							:workout="workout"
							:compact="true"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

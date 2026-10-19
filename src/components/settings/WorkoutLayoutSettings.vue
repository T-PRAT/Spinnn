<script setup>
import { getWorkoutLayoutPreview } from "@/components/workout/layouts/previews";
import { useI18n } from "@/composables/useI18n";
import { useWorkoutLayout } from "@/composables/useWorkoutLayout";

// Choix de la vue affichée pendant une séance. Le même choix est accessible en pleine séance
// par le petit sélecteur de la vue. La préférence est mémorisée (useStorage).
const { t } = useI18n();
const { layoutId, layouts, setLayout } = useWorkoutLayout();
</script>

<template>
	<div>
		<p class="text-sm text-muted-foreground mb-3">
			{{ t("settings.workoutLayout.description") }}
		</p>

		<!-- Vrais boutons radio masqués : le clavier (flèches) et les lecteurs d'écran
		     fonctionnent sans code, la carte entière est l'étiquette cliquable. -->
		<fieldset class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			<legend class="sr-only">{{ t("settings.workoutLayout.title") }}</legend>

			<label
				v-for="layout in layouts"
				:key="layout.id"
				:class="[
					'block cursor-pointer rounded-lg border-2 p-3 transition-all',
					'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background',
					layout.id === layoutId
						? 'border-primary bg-primary/10'
						: 'border-border hover:border-primary/50 hover:bg-muted/20',
				]"
			>
				<input
					type="radio"
					name="workout-layout"
					class="sr-only"
					:value="layout.id"
					:checked="layout.id === layoutId"
					@change="setLayout(layout.id)"
				/>
				<component
					:is="getWorkoutLayoutPreview(layout.id)"
					class="mb-3 block h-auto w-full overflow-hidden rounded-md border border-border"
				/>
				<span class="block text-sm font-semibold text-foreground">
					{{ t(layout.labelKey) }}
				</span>
				<span class="mt-0.5 block text-xs text-muted-foreground">
					{{ t(layout.descriptionKey) }}
				</span>
			</label>
		</fieldset>
	</div>
</template>

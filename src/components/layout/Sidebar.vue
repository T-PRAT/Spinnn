<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useWorkoutSession } from "@/composables/useWorkoutSession";
import { useI18n as useVueI18n } from "vue-i18n";
import {
	HomeIcon,
	PlayIcon,
	ClockIcon,
	Cog6ToothIcon,
} from "@heroicons/vue/24/outline";

const router = useRouter();
const route = useRoute();
const session = useWorkoutSession();

let t;
try {
	const i18n = useVueI18n();
	t = i18n.t;
} catch (e) {
	console.warn("i18n not available:", e);
	t = (key) => key;
}

const isMobileMenuOpen = ref(false);

// Collapse sidebar on desktop during workout
const isCollapsed = computed(() => route?.name === "workout");

const navItems = computed(() => {
	try {
		const items = [
			{
				name: (t && t("navigation.home")) || "Accueil",
				route: "setup",
				icon: "home",
				always: true,
			},
			{
				name: (t && t("navigation.workout")) || "Entraînement",
				route: "workout",
				icon: "play",
				condition: session.isActive.value,
			},
			{
				name: (t && t("navigation.history")) || "Historique",
				route: "history",
				icon: "history",
				always: true,
			},
		].filter((item) => item.always || item.condition);

		// Ensure all items have required properties
		return items.filter(item => item && item.name && item.route && item.icon);
	} catch (e) {
		console.error("Error in navItems:", e);
		return [
			{ name: "Accueil", route: "setup", icon: "home", always: true },
			{
				name: "Historique",
				route: "history",
				icon: "history",
				always: true,
			},
		];
	}
});

const settingsItem = computed(() => {
	try {
		const name = (t && t("navigation.settings")) || "Paramètres";
		return {
			name: name || "Paramètres",
			route: "settings",
			icon: "settings",
		};
	} catch (e) {
		console.error("Error in settingsItem:", e);
		return { name: "Paramètres", route: "settings", icon: "settings" };
	}
});

// Safe combined navigation items for mobile (ensures no undefined values)
const mobileNavItems = computed(() => {
	const items = [...navItems.value];
	if (settingsItem.value && settingsItem.value.name && settingsItem.value.route && settingsItem.value.icon) {
		items.push(settingsItem.value);
	}
	// Double-check that all items are valid
	return items.filter(item => item && item.name && item.route && item.icon);
});

function navigate(routeName) {
	if (!routeName) {
		console.error("navigate called with undefined routeName");
		return;
	}
	router.push({ name: routeName });
	isMobileMenuOpen.value = false;
}

function toggleMobileMenu() {
	isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

function getIconComponent(iconName) {
	if (!iconName || typeof iconName !== 'string') {
		return HomeIcon;
	}
	const iconMap = {
		home: HomeIcon,
		play: PlayIcon,
		history: ClockIcon,
		settings: Cog6ToothIcon,
	};
	return iconMap[iconName] || HomeIcon;
}
</script>

<template>
	<!-- Mobile bottom bar -->
	<nav
		class="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 flex justify-around items-center h-16 px-2 safe-area-inset-bottom"
	>
		<button
			v-for="item in mobileNavItems"
			:key="item.route"
			@click="navigate(item.route)"
			:class="[
				'flex flex-col items-center justify-center flex-1 h-full rounded-lg transition-all',
				route?.name === item.route
					? 'text-primary'
					: 'text-muted-foreground',
			]"
		>
			<component
				:is="getIconComponent(item.icon)"
				class="w-6 h-6"
			/>
			<span class="text-xs mt-1">{{ item.name }}</span>
		</button>
	</nav>

	<!-- Desktop sidebar -->
	<aside
		:class="[
			'hidden md:flex fixed top-0 left-0 h-full bg-card border-r border-border z-40 transition-all duration-300 flex-col',
			// Desktop: collapse when in workout
			isCollapsed ? 'w-20' : 'w-64',
		]"
	>
		<!-- Logo / Header -->
		<div
			:class="[
				'border-b border-border flex',
				isCollapsed ? 'justify-center p-3' : 'p-6',
			]"
		>
			<button
				@click="navigate('setup')"
				:class="[
					'hover:opacity-80 transition-opacity flex items-center',
					isCollapsed ? '' : 'gap-5',
				]"
				:title="isCollapsed ? 'Spin' : undefined"
			>
				<div
					:class="[
						'rounded-xl bg-secondary',
						isCollapsed ? 'p-2.5' : 'p-3',
					]"
				>
					<img
						src="/Logo.png"
						alt="Logo"
						:class="isCollapsed ? 'w-5 h-5' : 'w-6 h-6'"
					/>
				</div>
				<h1
					v-if="!isCollapsed"
					class="text-3xl font-bold text-primary-foreground tracking-tight font-heading"
				>
					Spinnn
				</h1>
			</button>
		</div>

		<!-- Main navigation -->
		<nav class="p-4 space-y-2 flex-1">
			<button
				v-for="item in navItems"
				:key="item.route"
				@click="navigate(item.route)"
				:class="[
					'w-full flex items-center rounded-lg transition-all',
					isCollapsed
						? 'justify-center px-3 py-3'
						: 'gap-3 px-4 py-3',
					route?.name === item.route
						? 'bg-primary/10 text-primary font-medium'
						: 'text-muted-foreground hover:bg-accent hover:text-foreground',
				]"
				:title="isCollapsed ? item.name : undefined"
			>
				<component
					:is="getIconComponent(item.icon)"
					class="w-5 h-5 flex-shrink-0"
				/>
				<span v-if="!isCollapsed" class="text-sm">{{ item.name }}</span>
			</button>
		</nav>

		<!-- Settings at bottom -->
		<div class="p-4 border-t border-border">
			<button
				@click="navigate(settingsItem.route)"
				:class="[
					'w-full flex items-center rounded-lg transition-all',
					isCollapsed
						? 'justify-center px-3 py-3'
						: 'gap-3 px-4 py-3',
					route?.name === settingsItem.route
						? 'bg-primary/10 text-primary font-medium'
						: 'text-muted-foreground hover:bg-accent hover:text-foreground',
				]"
				:title="isCollapsed ? settingsItem.name : undefined"
			>
				<component
					:is="getIconComponent(settingsItem.icon)"
					class="w-5 h-5 flex-shrink-0"
				/>
				<span v-if="!isCollapsed" class="text-sm">{{
					settingsItem.name
				}}</span>
			</button>
		</div>
	</aside>

	<!-- Spacer for desktop sidebar -->
	<div
		:class="[
			'hidden md:block flex-shrink-0',
			isCollapsed ? 'w-20' : 'w-64',
		]"
	></div>

	<!-- Spacer for mobile bottom bar -->
	<div class="md:hidden h-16"></div>
</template>

<template>
	<svg viewBox="0 0 160 100" aria-hidden="true" focusable="false">
		<!-- Miniature de la vue classique pour les Paramètres : purement décorative (la carte qui
		     la contient porte le libellé), ses couleurs suivent le thème de l'application. -->
		<rect class="bg" width="160" height="100" />

		<!-- En-tête : nom de la séance, chrono, progression -->
		<rect class="card" x="6" y="6" width="148" height="13" rx="2.5" />
		<rect class="text" x="10" y="9.6" width="34" height="2.6" rx="1.3" />
		<rect class="soft" x="10" y="14.2" width="52" height="1.8" rx="0.9" />
		<rect class="primary" x="131" y="9.6" width="19" height="3.8" rx="1.5" />
		<rect class="primary" x="6.4" y="17.9" width="26" height="0.9" rx="0.45" />

		<!-- Métriques : deux colonnes de petites cartes, puissance et fréquence cardiaque en grand -->
		<rect class="card" x="6" y="22" width="26" height="11" rx="2" />
		<rect class="card" x="6" y="35" width="26" height="11" rx="2" />
		<rect class="text" x="12" y="26.6" width="14" height="2.4" rx="1.2" />
		<rect class="text" x="12" y="39.6" width="14" height="2.4" rx="1.2" />

		<rect class="card" x="35" y="22" width="56" height="24" rx="2" />
		<rect class="primary" x="48" y="27" width="28" height="8" rx="1.8" />
		<rect class="soft" x="42" y="40" width="10" height="2" rx="1" />
		<rect class="soft" x="74" y="40" width="10" height="2" rx="1" />

		<rect class="card" x="94" y="22" width="40" height="24" rx="2" />
		<rect class="danger" x="102" y="27" width="24" height="8" rx="1.8" />
		<rect class="soft" x="99" y="40" width="8" height="2" rx="1" />
		<rect class="soft" x="121" y="40" width="8" height="2" rx="1" />

		<rect class="card" x="137" y="22" width="17" height="11" rx="2" />
		<rect class="card" x="137" y="35" width="17" height="11" rx="2" />

		<!-- Bloc en cours -->
		<rect class="card" x="6" y="49" width="148" height="8" rx="2" />
		<rect class="muted" x="9" y="51" width="26" height="4" rx="1.2" />
		<rect class="muted" x="40" y="52.4" width="96" height="1.4" rx="0.7" />
		<rect class="muted" x="140" y="51" width="11" height="4" rx="1.2" />

		<!-- Graphique : échauffement, 5 × (travail / récupération), retour au calme -->
		<rect class="card" x="6" y="60" width="148" height="28" rx="2" />
		<polygon class="zone-ramp" points="8,86 8,77 48,72 48,86" />
		<g class="zone-work">
			<rect x="48" y="62" width="9.6" height="24" />
			<rect x="67.2" y="62" width="9.6" height="24" />
			<rect x="86.4" y="62" width="9.6" height="24" />
			<rect x="105.6" y="62" width="9.6" height="24" />
			<rect x="124.8" y="62" width="9.6" height="24" />
		</g>
		<g class="zone-rest">
			<rect x="57.6" y="74" width="9.6" height="12" />
			<rect x="76.8" y="74" width="9.6" height="12" />
			<rect x="96" y="74" width="9.6" height="12" />
			<rect x="115.2" y="74" width="9.6" height="12" />
		</g>
		<polygon class="zone-ramp" points="134.4,86 134.4,73 152,76 152,86" />

		<!-- Barre de contrôle -->
		<rect class="card" x="6" y="91" width="148" height="7" rx="2" />
		<rect class="muted" x="10" y="93" width="12" height="3" rx="1" />
		<rect class="muted" x="24" y="93" width="12" height="3" rx="1" />
		<rect class="soft" x="98" y="93" width="16" height="3" rx="1" />
		<rect class="soft" x="116" y="93" width="16" height="3" rx="1" />
		<rect class="danger" x="134" y="93" width="16" height="3" rx="1" />
	</svg>
</template>

<style scoped>
.bg {
	fill: var(--background);
}

.card {
	fill: var(--card);
	stroke: var(--border);
	stroke-width: 0.6;
}

.text {
	fill: var(--foreground);
	opacity: 0.8;
}

.soft {
	fill: var(--muted-foreground);
	opacity: 0.55;
}

.muted {
	fill: var(--muted);
}

.primary {
	fill: var(--primary);
}

.danger {
	fill: var(--destructive);
}

.zone-ramp {
	fill: var(--zone-z1);
	opacity: 0.5;
}

.zone-work {
	fill: var(--zone-z5);
	opacity: 0.55;
}

.zone-rest {
	fill: var(--zone-z2);
	opacity: 0.55;
}
</style>

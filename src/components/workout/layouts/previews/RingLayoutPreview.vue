<template>
	<svg viewBox="0 0 160 100" aria-hidden="true" focusable="false">
		<!-- Miniature de la vue Anneau pour les Paramètres : purement décorative (la carte qui la
		     contient porte le libellé). Comme la vue elle-même, elle est toujours sombre : ses
		     couleurs sont en dur et ne suivent pas le thème de l'application. -->
		<defs>
			<radialGradient id="ring-preview-aurora" cx="50%" cy="50%" r="50%">
				<stop offset="0" stop-color="#EBC03A" stop-opacity="0.38" />
				<stop offset="1" stop-color="#EBC03A" stop-opacity="0" />
			</radialGradient>
			<radialGradient id="ring-preview-glow" cx="50%" cy="50%" r="50%">
				<stop offset="0" stop-color="#5BE38A" stop-opacity="0.3" />
				<stop offset="1" stop-color="#5BE38A" stop-opacity="0" />
			</radialGradient>
		</defs>

		<rect width="160" height="100" fill="#08090b" />
		<circle cx="132" cy="14" r="58" fill="url(#ring-preview-aurora)" />
		<circle cx="22" cy="80" r="46" fill="url(#ring-preview-glow)" />

		<!-- Anneau : le bloc a fait un peu plus du tiers de sa durée -->
		<circle cx="80" cy="44" r="35" fill="#08090b" />
		<circle cx="80" cy="44" r="33" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3" />
		<circle
			cx="80"
			cy="44"
			r="33"
			fill="none"
			stroke="#EBC03A"
			stroke-width="3"
			stroke-linecap="round"
			stroke-dasharray="132 208"
			transform="rotate(-90 80 44)"
		/>

		<!-- Contenu : pastille de mode, titre, répétitions, minuteur, bloc suivant, métriques -->
		<rect x="70" y="18" width="20" height="5" rx="2.5" fill="rgba(255,255,255,0.12)" />
		<circle cx="74" cy="20.5" r="1.1" fill="#5BE38A" />
		<rect x="77" y="19.8" width="9" height="1.4" rx="0.7" fill="rgba(238,240,242,0.8)" />
		<rect x="68" y="26" width="24" height="2.6" rx="1.3" fill="rgba(238,240,242,0.9)" />
		<circle cx="76" cy="32" r="1" fill="#eef0f2" />
		<circle cx="80" cy="32" r="1" fill="#EBC03A" />
		<circle cx="84" cy="32" r="1" fill="rgba(255,255,255,0.22)" />
		<text
			x="80"
			y="47"
			text-anchor="middle"
			font-family="Oxanium, system-ui, sans-serif"
			font-size="16"
			font-weight="800"
			fill="#eef0f2"
		>
			2:41
		</text>
		<rect x="67" y="50" width="1.4" height="4" rx="0.7" fill="#5BE38A" />
		<rect x="70.5" y="51.2" width="22" height="1.6" rx="0.8" fill="rgba(238,240,242,0.75)" />
		<rect x="64" y="58" width="9" height="1.2" rx="0.6" fill="rgba(238,240,242,0.45)" />
		<rect x="64" y="60.6" width="9" height="3.6" rx="1.2" fill="rgba(238,240,242,0.9)" />
		<rect x="76" y="57.6" width="8" height="1.2" rx="0.6" fill="rgba(238,240,242,0.45)" />
		<rect x="75" y="60" width="10" height="4.6" rx="1.4" fill="rgba(238,240,242,0.95)" />
		<rect x="87" y="58" width="9" height="1.2" rx="0.6" fill="rgba(238,240,242,0.45)" />
		<rect x="87" y="60.6" width="9" height="3.6" rx="1.2" fill="#ff8b8b" />

		<!-- Barre de contrôle -->
		<rect x="36" y="86" width="88" height="9" rx="3" fill="rgba(255,255,255,0.06)" />
		<rect x="39" y="88" width="9" height="5" rx="1.6" fill="rgba(255,255,255,0.14)" />
		<rect x="51" y="88" width="14" height="5" rx="1.6" fill="rgba(255,255,255,0.14)" />
		<rect x="68" y="88" width="14" height="5" rx="1.6" fill="rgba(255,255,255,0.14)" />
		<rect x="85" y="88" width="9" height="5" rx="1.6" fill="rgba(255,255,255,0.14)" />
		<rect x="97" y="88" width="9" height="5" rx="1.6" fill="rgba(255,90,95,0.3)" />
		<rect x="109" y="88" width="12" height="5" rx="1.6" fill="rgba(255,255,255,0.14)" />
	</svg>
</template>

# Spinnn — Guide d'usage du logo

## 1. Le logo

**L'idée :** les trois n du nom montent comme un test rampe. Le « spi » est en encre et le « nnn » en orange, pour isoler la rampe.

| Version | Fichier | Usage |
|---|---|---|
| Wordmark (principal) | `svg/spinnn-wordmark.svg` | Partout où il y a de la place : en-tête, sidebar, écrans d'accueil |
| Wordmark sur fond sombre | `svg/spinnn-wordmark-dark.svg` | Thème sombre de l'app, fonds Nuit |
| Symbole « nnn » | `svg/spinnn-symbol.svg` | Petits espaces : favicon, avatar, icône |
| Icône d'app | `svg/spinnn-app-icon.svg` | Symbole blanc sur tuile orange (PWA, écran d'accueil) |
| Une couleur | `*-black.svg`, `*-white.svg`, `spinnn-wordmark-orange.svg` | Impression une couleur, gravure, fonds photo |

Les versions blanches et le wordmark sombre sont amincis de 1 unité. Le clair sur foncé paraît plus gras à l'œil, ce qui compense l'effet.

## 2. Zone de protection

Garder autour du logo un espace libre égal à **la moitié de la hauteur du premier n**. Cet espace grandit avec le logo : ne jamais utiliser une distance fixe.

## 3. Tailles minimales

| Version | Écran | Impression |
|---|---|---|
| Wordmark | 72 px de large | 20 mm de large |
| Symbole | 16 px (`web/favicon.svg`, dessiné pour cette taille) | 6 mm |

Le symbole est construit sur une grille de 16 × 16 : à 16, 32 et 48 px, les traits tombent pile sur les pixels. Pour un favicon, utiliser les fichiers de `web/` tels quels, sans ajouter de marge.

## 4. Couleurs

| Nom | HEX | RGB | CMJN (approx.) | Rôle |
|---|---|---|---|---|
| Orange Spinnn | `#EA580C` | 234 88 12 | 0 62 95 8 | La rampe, l'icône d'app, les accents |
| Nuit | `#1C1917` | 28 25 23 | 0 11 18 89 | Le « spi », texte, fonds sombres |
| Craie | `#FDFBF7` | 253 251 247 | 0 1 2 1 | Fonds clairs, « spi » sur fond sombre |

Contraste de l'orange : 3,6:1 sur blanc et 4,9:1 sur Nuit. Il tient donc dans les deux thèmes de l'app.
Les valeurs CMJN sont une conversion directe, à valider avec l'imprimeur. Aucun Pantone n'est fixé : à choisir sur nuancier si besoin d'impression.

**Associations validées :**
- wordmark bicolore sur blanc ou Craie ;
- wordmark sombre sur Nuit ;
- blanc sur Orange ;
- noir sur blanc ;
- symbole orange sur fond clair ou sombre.

Sur une photo, utiliser la version blanche ou noire sur une zone calme.

## 5. Typographie

- Le wordmark est dessiné à la main en tracés : ce n'est pas une police. Ne jamais le retaper avec une police.
- Dans l'app : Oxanium (titres), Merriweather (texte), Fira Code (données). Les trois sont sous licence libre SIL OFL (Google Fonts).

## 6. À ne pas faire

- Inverser les couleurs (« spi » orange, « nnn » noir) ou colorer chaque n différemment.
- Mettre les trois n à la même hauteur, changer la pente ou ajouter un quatrième n.
- Déformer, incliner, faire pivoter le logo.
- Ajouter ombre, contour, dégradé ou effet.
- Rapprocher ou espacer les lettres.
- Placer le symbole à côté d'un indicateur de réseau ou de batterie : il pourrait être pris pour des barres de signal.

## 7. Fichiers

```
design/logo/
├── svg/        masters vectoriels (wordmark, symbole, icône d'app, versions une couleur)
├── png/        exports PNG transparents (wordmark 1300 px, symbole 512 et 1024 px)
├── web/        favicon.ico, favicon.svg, PNG 16/32/48, apple-touch-icon, icônes PWA, site.webmanifest, head-snippet.html
└── source/     scripts Python qui génèrent les masters (modifier les paramètres puis relancer)
```

Pour régénérer les masters SVG : `python3 design/logo/source/kit.py design/logo`. Les PNG et les icônes web se refont ensuite avec les scripts du skill logo-design.

Avant tout usage public (dépôt de marque, store d'apps), faire une recherche d'antériorité de marque.

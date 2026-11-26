# English Game

Site compagnon d'un jeu de cartes papier : on tire des événements financiers réels (bourse, immobilier,
épargne), avec leur score, leur année et leur source.

Construit avec [Astro](https://astro.build) (HTML, CSS et JavaScript, sans framework).

## Commandes

| Commande | Action |
|---|---|
| `npm install` | Installe les dépendances |
| `npm run dev` | Serveur local sur `http://localhost:4321` |
| `npm run build` | Construit le site dans `dist/` (et le mode hors ligne) |
| `npm run preview` | Sert le site construit (permet de tester le hors ligne) |

## Les pages

| Adresse | Contenu |
|---|---|
| `/` | **Play** : 6 manches, une carte tirée au hasard par manche (la partie est sauvegardée) |
| `/library` | Toutes les cartes, avec filtres et tri |
| `/cards/N/` | La page d'une carte avec ses sources (c'est l'adresse des QR codes) |
| `/rules` | Les règles |
| `/add-event` | Formulaire pour proposer un événement (voir ci-dessous) |
| `/qr` | Les QR codes à imprimer (un par carte) |

## Où modifier quoi

- **Les cartes** : `src/data/cards.json` (une carte = un objet ; `id` unique, `score` de −4 à +4).
- **Les couleurs, tailles, marges** : `src/styles/token.css`.
- **Le design** : `src/styles/style.css`.
- **Le jeu** (tirage, sauvegarde) : `src/scripts/draw.js`.

## Le mode hors ligne

Après `npm run build`, un *service worker* (`dist/sw.js`, généré à partir de `src/sw.template.js` par
`astro.config.mjs`) met tout le site en cache : il fonctionne sans internet après la première visite et
peut s'installer sur l'écran d'accueil d'un téléphone.

## QR codes

Ouvre `/qr` sur le site **en ligne**, vérifie l'adresse publique indiquée, puis imprime la page :
chaque code ouvre la page de sa carte.

## Proposer un événement (`/add-event`)

Le formulaire crée une *Pull Request* GitHub que tu valides d'un clic : rien n'est publié sans relecture.
Mise en route (GitHub, Vercel, jeton) : [`docs/add-event.md`](docs/add-event.md).

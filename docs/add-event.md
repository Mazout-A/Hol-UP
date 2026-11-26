# Formulaire « Add an event » : mise en route

Le formulaire (`/add-event`) permet à n'importe qui de proposer un événement financier.
**Rien n'est publié tout seul** : chaque proposition devient une *Pull Request* sur ton GitHub.
Tu la relis, tu cliques **Merge**, et la carte est en ligne.

```
Visiteur ── formulaire ──► fonction Vercel (api/submit-event.js)
                              │  vérifie tout (nom, description, score, source https…)
                              ▼
                       GitHub : nouvelle branche + cards.json modifié + Pull Request
                              │
        toi : relis la Pull Request, vérifie la source ── Merge ──► Vercel redéploie ──► carte en ligne
```

Vercel crée aussi un **aperçu du site pour chaque Pull Request** : tu peux voir la nouvelle carte
en vrai avant de fusionner (le lien apparaît dans la Pull Request).

## Ce qui est déjà prêt dans le code

| Fichier | Rôle |
|---|---|
| `src/pages/add-event.astro` | La page du formulaire, avec aperçu de la carte en direct |
| `src/lib/events.js` | Les règles : nom 3 à 40 caractères, description 40 à 250, source en `https`, score… |
| `src/lib/submit-event.js` | Anti-spam, écriture dans `cards.json`, branche et Pull Request GitHub |
| `api/submit-event.js` | La fonction que Vercel exécute quand quelqu'un envoie le formulaire |
| `.env.example` | Modèle des variables secrètes (à copier en `.env`) |

**Comment le score est calculé** : le visiteur choisit *Gain ou Loss* et *la portée*
(Worldwide = 4, Several countries = 3, One country = 2, Limited = 1).
Un krach mondial vaut donc −4. Le serveur recalcule toujours le score lui-même.

## À faire une seule fois (je ne peux pas le faire à ta place : ce sont tes comptes)

### 1. Mettre le code sur GitHub
Ton dépôt est `Mazout-A/Hol-UP`. Le code de cette fonctionnalité n'y est pas encore :
il faut le *commit* puis le *push* (je ne l'ai pas fait, tu me l'avais demandé).

### 2. Déployer sur Vercel
1. Va sur vercel.com → **Add New… → Project** → importe `Mazout-A/Hol-UP`.
2. Vercel détecte Astro tout seul. Clique **Deploy**.
3. Le dossier `api/` est reconnu automatiquement comme fonction serveur.

### 3. Créer le jeton GitHub (la « clé » que la fonction utilisera)
1. GitHub → ton avatar → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. **Repository access** : *Only select repositories* → choisis **uniquement** `Hol-UP`.
3. **Permissions → Repository permissions** :
   - **Contents** : *Read and write*
   - **Pull requests** : *Read and write*
4. Expiration : 90 jours, par exemple (tu pourras le renouveler).
5. Copie le jeton (il commence par `github_pat_…`). **Il ne s'affiche qu'une fois.**

> Ne colle jamais ce jeton dans le code, dans un message ou dans un fichier envoyé sur GitHub.
> Le fichier `.env` est ignoré par git, c'est le seul endroit sûr en local.

### 4. Donner le jeton à Vercel
Vercel → ton projet → **Settings → Environment Variables**, ajoute :

| Nom | Valeur |
|---|---|
| `GITHUB_TOKEN` | le jeton copié à l'étape 3 |
| `GITHUB_REPO` | `Mazout-A/Hol-UP` |
| `GITHUB_BASE_BRANCH` | `main` (facultatif) |

Puis **Redeploy** (Deployments → les trois points → Redeploy) pour que les variables soient prises en compte.

### 5. Tester
1. Ouvre `ton-site.vercel.app/add-event`, remplis le formulaire avec un vrai événement, envoie.
2. Sur GitHub, onglet **Pull requests** : une proposition « Add event: … » doit apparaître.
3. Relis, ouvre la source, puis **Merge pull request**. Une à deux minutes plus tard, la carte est en ligne.

## Quand tu relis une proposition

La Pull Request contient un tableau (pays, catégorie, score, période, source) et une liste à cocher :
source fiable, chiffres présents dans la source, score cohérent, ton neutre.
La carte est ajoutée avec `"verified": false` : passe-le à `true` dans `cards.json` une fois la source relue.
**Close** = refuser la proposition (rien n'est publié).

## Tester en local, sans GitHub

`npm run dev` puis `http://localhost:4321/add-event` : sans fichier `.env`, le formulaire est en **mode essai**
(il vérifie tout, affiche « Test mode » et n'envoie rien). Pour tester avec GitHub en vrai,
copie `.env.example` en `.env` et remplis le jeton.

## Limites à connaître

- **Pas de limite de fréquence** : quelqu'un peut envoyer beaucoup de propositions. Elles restent des Pull Requests que tu peux
  fermer, rien n'est publié, mais ça peut encombrer. Si ça arrive, on ajoutera un captcha (par exemple Cloudflare Turnstile).
- **Deux propositions en même temps** reçoivent le même numéro de carte : la deuxième aura un conflit à régler au moment du Merge.
- **Le formulaire nécessite internet** (il est le seul élément du site qui ne marche pas hors ligne).
- **Jeton expiré** : le formulaire affichera « This form is not available yet » ; renouvelle le jeton et mets à jour la variable.

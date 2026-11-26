// Traitement d'un événement proposé : vérification, puis création d'une Pull Request GitHub.
// Rien ici ne dépend de Vercel : `submitEvent` reçoit tout ce dont il a besoin (testable sans réseau).

import {
  clean, validateEvent, buildCard, insertCard, missingCategory,
  baseCategory, slugify, pullRequestBody,
} from './events.js'

const MIN_FILL_MS = 3000            // un humain met plus de 3 s à remplir le formulaire
const MAX_FILL_MS = 24 * 3600 * 1000

const utf8ToBase64 = (text) => Buffer.from(text, 'utf8').toString('base64')
const base64ToUtf8 = (b64) => Buffer.from(b64, 'base64').toString('utf8')

// ---------- Stockage « GitHub » : lit cards.json, crée une branche + une Pull Request ----------
export function githubStore({ token, repo, baseBranch = 'main' }, fetchImpl = fetch) {
  const api = async (path, options = {}) => {
    const response = await fetchImpl(`https://api.github.com/repos/${repo}${path}`, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'english-game-add-event',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`GitHub ${options.method ?? 'GET'} ${path} -> ${response.status} ${detail.slice(0, 200)}`)
    }
    return response.json()
  }

  return {
    async getCardsFile() {
      const file = await api(`/contents/src/data/cards.json?ref=${encodeURIComponent(baseBranch)}`)
      return { text: base64ToUtf8(file.content), sha: file.sha }
    },

    async createProposal({ branch, message, text, fileSha, title, body }) {
      const ref = await api(`/git/ref/heads/${encodeURIComponent(baseBranch)}`)
      await api('/git/refs', {
        method: 'POST',
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: ref.object.sha }),
      })
      await api('/contents/src/data/cards.json', {
        method: 'PUT',
        body: JSON.stringify({ message, content: utf8ToBase64(text), sha: fileSha, branch }),
      })
      const pr = await api('/pulls', {
        method: 'POST',
        body: JSON.stringify({ title, head: branch, base: baseBranch, body }),
      })
      return { url: pr.html_url }
    },
  }
}

// ---------- Stockage « essai » (développement, sans jeton) : ne publie rien ----------
export function dryRunStore(readFile) {
  return {
    async getCardsFile() {
      return { text: await readFile(), sha: 'dry-run' }
    },
    async createProposal({ branch, text }) {
      return { url: `dry-run://${branch}`, preview: text }
    },
  }
}

// Vérifie que le lien répond (information pour la personne qui relit ; ne bloque jamais l'envoi)
async function checkLink(url, fetchImpl) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetchImpl(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal })
    if (response.ok) return `✅ le lien répond (HTTP ${response.status})`
    return `⚠️ le lien répond avec HTTP ${response.status} (certains sites refusent les robots : à ouvrir à la main)`
  } catch {
    return '⚠️ le lien n\'a pas pu être testé (à ouvrir à la main)'
  } finally {
    clearTimeout(timer)
  }
}

/**
 * body : données du formulaire. store : githubStore() ou dryRunStore().
 * Retourne { status, json } à renvoyer au navigateur.
 */
export async function submitEvent(body, store, deps = {}) {
  const now = deps.now ?? new Date()
  const fetchImpl = deps.fetch ?? fetch

  // Anti-spam 1 : champ piège invisible (seuls les robots le remplissent). On répond « ok » sans rien faire.
  if (clean(body?.website, 200)) return { status: 200, json: { ok: true } }

  // Anti-spam 2 : un formulaire rempli en moins de 3 secondes n'est pas humain
  const elapsed = now.getTime() - Number(body?.startedAt)
  if (!(elapsed >= MIN_FILL_MS && elapsed <= MAX_FILL_MS)) {
    return { status: 400, json: { ok: false, error: 'Please take a moment to fill in the form, then send it again.' } }
  }

  try {
    const file = await store.getCardsFile()
    const data = JSON.parse(file.text)

    const categories = [...new Set(Object.keys(data.categories).map(baseCategory))]
    const existingTitles = data.cards.map((card) => card.title?.en ?? '')

    const { ok, errors, value } = validateEvent(body ?? {}, { categories, existingTitles, now })
    if (!ok) return { status: 422, json: { ok: false, errors } }

    const nextId = Math.max(0, ...data.cards.map((card) => card.id)) + 1
    const card = buildCard(value, nextId)
    const newCategory = missingCategory(data, card, value.categoryBase)

    const text = insertCard(file.text, card, newCategory)

    // Contrôle final : le fichier produit doit rester un JSON valide avec exactement une carte de plus
    const check = JSON.parse(text)
    if (check.cards.length !== data.cards.length + 1 || check.cards.at(-1).id !== nextId || !check.categories[card.category]) {
      throw new Error('Generated cards.json failed the sanity check')
    }

    const linkCheck = await checkLink(value.source.url, fetchImpl)
    const stamp = now.toISOString().replace(/\D/g, '').slice(0, 14)

    const proposal = await store.createProposal({
      branch: `event/${slugify(value.title)}-${stamp}`,
      message: `Add event: ${value.title}`,
      text,
      fileSha: file.sha,
      title: `Add event: ${value.title}`,
      body: pullRequestBody(card, value, linkCheck, newCategory),
    })

    return { status: 200, json: { ok: true, dryRun: String(proposal.url).startsWith('dry-run://') || undefined, card: deps.returnCard ? card : undefined } }
  } catch (error) {
    console.error('[add-event]', error?.message ?? error)
    return { status: 502, json: { ok: false, error: 'We could not send your event right now. Please try again in a few minutes.' } }
  }
}

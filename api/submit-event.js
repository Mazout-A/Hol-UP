// Fonction Vercel : POST /api/submit-event
// Reçoit le formulaire « Add an event » et ouvre une Pull Request GitHub (voir src/lib/submit-event.js).
// Variables à définir dans Vercel (Settings > Environment Variables) :
//   GITHUB_TOKEN : jeton GitHub limité à ce dépôt (Contents + Pull requests : lecture/écriture)
//   GITHUB_REPO  : « propriétaire/dépôt », par exemple Mazout-A/Hol-UP
//   GITHUB_BASE_BRANCH (facultatif) : branche principale, « main » par défaut

import { readFile } from 'node:fs/promises'
import { githubStore, dryRunStore, submitEvent } from '../src/lib/submit-event.js'

const MAX_BODY_CHARS = 20000

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  let body = req.body
  if (typeof body === 'string') {
    if (body.length > MAX_BODY_CHARS) return res.status(413).json({ ok: false, error: 'Request too large' })
    try { body = JSON.parse(body) } catch { return res.status(400).json({ ok: false, error: 'Invalid request' }) }
  }
  if (!body || typeof body !== 'object' || JSON.stringify(body).length > MAX_BODY_CHARS) {
    return res.status(400).json({ ok: false, error: 'Invalid request' })
  }

  const { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BASE_BRANCH, VERCEL } = process.env

  let store
  if (GITHUB_TOKEN && GITHUB_REPO) {
    store = githubStore({ token: GITHUB_TOKEN, repo: GITHUB_REPO, baseBranch: GITHUB_BASE_BRANCH || 'main' })
  } else if (VERCEL) {
    // En ligne sans jeton : on le dit clairement plutôt que de faire semblant d'avoir enregistré
    console.error('[add-event] GITHUB_TOKEN or GITHUB_REPO is missing')
    return res.status(503).json({ ok: false, error: 'This form is not available yet. Please try again later.' })
  } else {
    // En local sans jeton : mode essai, rien n'est envoyé à GitHub
    store = dryRunStore(() => readFile(new URL('../src/data/cards.json', import.meta.url), 'utf8'))
  }

  const result = await submitEvent(body, store)
  return res.status(result.status).json(result.json)
}

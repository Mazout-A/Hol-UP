// Règles du formulaire « Add an event » — utilisées par le navigateur (aide en direct)
// ET par le serveur (vraie vérification : ne jamais faire confiance au navigateur).

export const LIMITS = {
  titleMin: 3, titleMax: 40,
  textMin: 40, textMax: 250,
  countryMin: 2, countryMax: 40,
  sourceNameMin: 3, sourceNameMax: 120,
  urlMax: 300,
  minYear: 1600,
}

// Portée de l'événement : elle donne la force du score (un impact mondial vaut 4)
export const REACH = [
  { value: 4, label: 'Worldwide', hint: 'Felt by markets all over the world.' },
  { value: 3, label: 'Several countries', hint: 'A whole region or several economies.' },
  { value: 2, label: 'One country', hint: 'Mainly one national market.' },
  { value: 1, label: 'Limited', hint: 'One sector, one city or a small market.' },
]

export const DIRECTIONS = [
  { value: 'positive', label: 'Gain', hint: 'Prices rose or recovered.' },
  { value: 'negative', label: 'Loss', hint: 'Prices fell or crashed.' },
]

// Nettoie un texte : retire les caractères de contrôle, réduit les espaces multiples
export const clean = (value, max = 2000) =>
  String(value ?? '')
    .slice(0, max)
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// Score = sens (+ ou −) x portée (1 à 4) : un krach mondial vaut donc -4
export const scoreFrom = (direction, reach) => (direction === 'negative' ? -1 : 1) * reach

export const baseCategory = (key) => String(key).split('_')[0]

// Vérifie qu'une adresse de source est un vrai lien https public
export function checkSourceUrl(raw) {
  const value = clean(raw, 1000)
  if (!value) return { ok: false, error: 'Add a link to your source.' }
  if (value.length > LIMITS.urlMax) return { ok: false, error: `The link is too long (max ${LIMITS.urlMax} characters).` }

  let url
  try {
    url = new URL(value)
  } catch {
    return { ok: false, error: 'This is not a valid link. Start with https://' }
  }

  if (url.protocol !== 'https:') return { ok: false, error: 'The link must start with https://' }

  const host = url.hostname.toLowerCase()
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':') || host.startsWith('[')
  if (!host.includes('.') || isIp || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    return { ok: false, error: 'Use the public address of a website (not an IP address or a local address).' }
  }
  if (url.username || url.password) return { ok: false, error: 'The link must not contain a login or password.' }

  return { ok: true, url: url.href }
}

const toYear = (value) => {
  const text = clean(value, 10)
  return /^\d{4}$/.test(text) ? Number(text) : null
}

/**
 * Vérifie un événement proposé.
 * ctx : { categories: ['stocks', ...], existingTitles: [...], now: Date }
 * Retourne { ok, errors: { champ: message }, value }
 */
export function validateEvent(input, ctx) {
  const errors = {}
  const now = ctx.now ?? new Date()
  const thisYear = now.getUTCFullYear()

  const title = clean(input.title, 200)
  if (title.length < LIMITS.titleMin) errors.title = `Give your event a name (at least ${LIMITS.titleMin} characters).`
  else if (title.length > LIMITS.titleMax) errors.title = `The name is too long (max ${LIMITS.titleMax} characters).`
  else if ((ctx.existingTitles ?? []).some((t) => clean(t).toLowerCase() === title.toLowerCase())) {
    errors.title = 'A card with this name already exists.'
  }

  const text = clean(input.text, 2000)
  if (text.length < LIMITS.textMin) errors.text = `Describe what happened and its figures (at least ${LIMITS.textMin} characters).`
  else if (text.length > LIMITS.textMax) errors.text = `The description is too long (max ${LIMITS.textMax} characters).`

  const country = clean(input.country, 200)
  if (country.length < LIMITS.countryMin) errors.country = 'Tell us where it happened (a country, a region or Worldwide).'
  else if (country.length > LIMITS.countryMax) errors.country = `Too long (max ${LIMITS.countryMax} characters).`

  const categoryBase = clean(input.category, 50).toLowerCase()
  if (!(ctx.categories ?? []).includes(categoryBase)) errors.category = 'Choose one of the categories.'

  const direction = clean(input.direction, 20)
  if (!DIRECTIONS.some((d) => d.value === direction)) errors.direction = 'Was it a gain or a loss?'

  const reach = Number(input.reach)
  if (!REACH.some((r) => r.value === reach)) errors.reach = 'Choose how far the event reached.'

  const start = toYear(input.startYear)
  const endRaw = clean(input.endYear, 10)
  const end = endRaw ? toYear(endRaw) : null
  if (start === null || start < LIMITS.minYear || start > thisYear) {
    errors.startYear = `Enter a 4-digit year between ${LIMITS.minYear} and ${thisYear}.`
  }
  if (endRaw && (end === null || end > thisYear)) {
    errors.endYear = `Enter a 4-digit year up to ${thisYear}, or leave it empty.`
  } else if (end !== null && start !== null && end < start) {
    errors.endYear = 'The end year cannot be before the start year.'
  }

  const sourceName = clean(input.sourceName, 300)
  if (sourceName.length < LIMITS.sourceNameMin) errors.sourceName = 'Name your source (for example the newspaper or institution).'
  else if (sourceName.length > LIMITS.sourceNameMax) errors.sourceName = `Too long (max ${LIMITS.sourceNameMax} characters).`

  const sourceCheck = checkSourceUrl(input.sourceUrl)
  if (!sourceCheck.ok) errors.sourceUrl = sourceCheck.error

  // Deuxième source : facultative, mais nom et lien vont ensemble
  const name2 = clean(input.source2Name, 300)
  const url2 = clean(input.source2Url, 1000)
  let second = null
  if (name2 || url2) {
    const check2 = checkSourceUrl(url2)
    if (name2.length < LIMITS.sourceNameMin) errors.source2Name = 'Name the second source, or clear its link.'
    else if (name2.length > LIMITS.sourceNameMax) errors.source2Name = `Too long (max ${LIMITS.sourceNameMax} characters).`
    if (!check2.ok) errors.source2Url = check2.error
    if (!errors.source2Name && !errors.source2Url) second = { name: name2, url: check2.url }
  }

  if (input.confirm !== true && input.confirm !== 'true' && input.confirm !== 'on') {
    errors.confirm = 'Please confirm that the facts come from your source.'
  }

  const ok = Object.keys(errors).length === 0
  const value = ok
    ? {
        title, text, country, categoryBase, direction, reach,
        score: scoreFrom(direction, reach),
        year: end !== null && end !== start ? `${start}–${end}` : String(start),
        source: { name: sourceName, url: sourceCheck.url },
        sources: second ? [second] : [],
      }
    : null

  return { ok, errors, value }
}

// Carte telle qu'elle sera écrite dans cards.json (verified: false tant que tu n'as pas relu la source)
export function buildCard(value, id) {
  return {
    id,
    category: `${value.categoryBase}_${value.direction}`,
    score: value.score,
    year: value.year,
    title: { en: value.title },
    text: { en: value.text },
    source: { name: value.source.name, url: value.source.url, verified: false },
    sources: value.sources,
    country: value.country,
  }
}

const q = (s) => JSON.stringify(s)

// Même mise en forme que le reste du fichier (objets courts sur une ligne)
export function formatCard(card) {
  const lines = [
    '    {',
    `      "id": ${card.id},`,
    `      "category": ${q(card.category)},`,
    `      "score": ${card.score},`,
    `      "year": ${q(card.year)},`,
    `      "title": { "en": ${q(card.title.en)} },`,
    `      "text": { "en": ${q(card.text.en)} },`,
    `      "source": { "name": ${q(card.source.name)}, "url": ${q(card.source.url)}, "verified": ${card.source.verified} },`,
  ]
  if (card.sources.length === 0) {
    lines.push('      "sources": [],')
  } else {
    lines.push('      "sources": [')
    card.sources.forEach((s, i) => {
      lines.push(`        { "name": ${q(s.name)}, "url": ${q(s.url)} }${i < card.sources.length - 1 ? ',' : ''}`)
    })
    lines.push('      ],')
  }
  lines.push(`      "country": ${q(card.country)}`)
  lines.push('    }')
  return lines.join('\n')
}

// Catégorie manquante (ex. savings_negative) : on copie le libellé d'une catégorie de même famille
export function missingCategory(data, card, categoryBase) {
  if (data.categories[card.category]) return null
  const sibling = Object.entries(data.categories).find(([key]) => baseCategory(key) === categoryBase)
  if (!sibling) return null
  return { key: card.category, label: sibling[1].label }
}

/**
 * Ajoute la carte (et, si besoin, une catégorie) dans le TEXTE de cards.json,
 * sans reformater le reste du fichier : la Pull Request n'affiche que les lignes ajoutées.
 */
export function insertCard(text, card, newCategory) {
  const crlf = text.includes('\r\n')
  let s = text.replace(/\r\n/g, '\n')

  if (newCategory) {
    const marker = '\n  },\n  "cards": ['
    const at = s.indexOf(marker)
    if (at < 0) throw new Error('Unexpected cards.json layout (categories)')
    const label = Object.entries(newCategory.label)
      .map(([lang, value]) => `${q(lang)}: ${q(value)}`)
      .join(', ')
    s = `${s.slice(0, at)},\n    ${q(newCategory.key)}: { "label": { ${label} } }${s.slice(at)}`
  }

  const end = s.lastIndexOf('\n  ]\n}')
  if (end < 0) throw new Error('Unexpected cards.json layout (cards)')
  s = `${s.slice(0, end)},\n${formatCard(card)}${s.slice(end)}`

  return crlf ? s.replace(/\n/g, '\r\n') : s
}

export const slugify = (text) =>
  clean(text, 100)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'event'

// Texte de la Pull Request : tout ce qu'il faut pour relire en 1 minute
export function pullRequestBody(card, value, linkCheck, newCategory) {
  const fence = '````'
  const sign = card.score > 0 ? `+${card.score}` : String(card.score)
  const reach = REACH.find((r) => r.value === value.reach)?.label ?? value.reach
  return [
    `## Nouvel événement proposé : ${card.title.en}`,
    '',
    '| | |',
    '|---|---|',
    `| Pays / zone | ${card.country} |`,
    `| Catégorie | \`${card.category}\`${newCategory ? ' (**nouvelle catégorie ajoutée**)' : ''} |`,
    `| Score | **${sign}** (${value.direction === 'negative' ? 'perte' : 'gain'}, portée : ${reach}) |`,
    `| Période | ${card.year} |`,
    `| Source principale | [${card.source.name}](${card.source.url}) |`,
    `| Vérification du lien | ${linkCheck} |`,
    '',
    '### Description',
    '',
    `> ${card.text.en}`,
    '',
    '### À vérifier avant de fusionner',
    '',
    '- [ ] La source est fiable (presse économique, banque centrale, institut officiel)',
    '- [ ] Les chiffres de la description sont bien dans la source',
    '- [ ] Le score est cohérent avec les autres cartes',
    '- [ ] Le ton est neutre (aucun conseil d\'investissement)',
    '- [ ] Passer `"verified"` à `true` dans `cards.json` une fois la source relue',
    '',
    '<details><summary>Carte ajoutée à cards.json</summary>',
    '',
    `${fence}json`,
    formatCard(card).replace(/````/g, "'''"),
    fence,
    '',
    '</details>',
    '',
    '_Proposition envoyée depuis le formulaire du site. **Merge** = la carte est publiée (Vercel redéploie tout seul) ; **Close** = refusée._',
  ].join('\n')
}

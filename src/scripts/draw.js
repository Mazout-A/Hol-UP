import data from '../data/cards.json'
////////////////////////////////////////////


const en = 'en';
const max_rounds = 6;
const STORAGE_KEY = 'english-game:game:v1';

const $ = (id) => {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Element #${id} not found`)
  return el
}

const button = $('draw')
const rest_button = $('reset')
const card_el = $('card')
const back_el = $('card-back')
const round_el = $('round')
const year_el = $('year')
const title_el = $('title')
const text_el = $('text')
const score_el = $('score')
const score_label_el = $('score-label')
const source = $('source')

const cards_by_id = new Map(data.cards.map((card) => [card.id, card]))
const reduce_motion = window.matchMedia('(prefers-reduced-motion: reduce)')
////////////////////////////////////////////


let round = 0;
let deck = [...data.cards];
let current = null;
////////////////////////////////////////////


// Sauvegarde : la partie reprend là où on l'a laissée (localStorage)
function save() {
  try {
    if (round === 0) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        round,
        deck: deck.map((card) => card.id),
        current: current ? current.id : null,
      }))
    }
  } catch {
    // stockage indisponible (navigation privée...) : le jeu fonctionne quand même
  }
}

// Relit la sauvegarde ; retourne false si elle est absente ou invalide
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (!saved || !Array.isArray(saved.deck)) return false

    const remaining = saved.deck.map((id) => cards_by_id.get(id))
    const card = cards_by_id.get(saved.current)
    const valid =
      Number.isInteger(saved.round) && saved.round >= 1 && saved.round <= max_rounds &&
      card && remaining.every(Boolean) &&
      !remaining.includes(card) &&
      new Set(saved.deck).size === saved.deck.length

    if (!valid) return false

    round = saved.round
    deck = remaining
    show(card, false)
    return true
  } catch {
    return false
  }
}
////////////////////////////////////////////


function show(card, animate) {
  current = card
  const category = data.categories[card.category]
  const sign = card.score > 0 ? '+' : ''

  card_el.dataset.sentiment = card.score > 0 ? 'positive' : 'negative'
  card_el.hidden = false
  back_el.hidden = true

  year_el.textContent = card.year;
  title_el.textContent = card.title[en];
  text_el.textContent = card.text[en];

  source.href = card.source.url
  source.textContent = new URL(card.source.url).hostname.replace('www.', '')
  source.title = card.source.name

  score_el.textContent = `${sign}${card.score}`
  score_label_el.textContent = category.label[en]

  round_el.innerHTML = `<span class="round_label">Round </span>${round} / ${max_rounds}`
  rest_button.hidden = false
  button.disabled = round >= max_rounds || deck.length === 0

  // Petite entrée de la carte (désactivée si l'utilisateur préfère moins d'animations)
  if (animate && !reduce_motion.matches) {
    card_el.animate(
      [
        { opacity: 0, transform: 'translateY(1.5rem) rotate(-2deg) scale(0.97)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 320, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
    )
  }
}

function clear() {
  current = null
  card_el.hidden = true
  back_el.hidden = false
  delete card_el.dataset.sentiment

  round_el.textContent = ""
  year_el.textContent = ""
  title_el.textContent = ""
  text_el.textContent = ""
  score_el.textContent = ""
  score_label_el.textContent = ""
  source.removeAttribute('href')
  source.textContent = ""
  source.removeAttribute('title')

  button.disabled = false
  rest_button.hidden = true
}
////////////////////////////////////////////


button.addEventListener('click', () => {
  if (round >= max_rounds || deck.length === 0) return
  const i = Math.floor(Math.random() * deck.length);
  const [card] = deck.splice(i, 1);
  round++

  show(card, true)
  save()

  // Le bouton « Draw a card » vient d'être désactivé : on garde le focus clavier utile
  if (button.disabled) rest_button.focus()
})
////////////////////////////////////////////


rest_button.addEventListener('click', () => {
  deck = [...data.cards];
  round = 0
  clear()
  save()
  button.focus()
})
////////////////////////////////////////////


if (!load()) clear()

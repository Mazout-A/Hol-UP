import data from '../data/cards.json'
// const cards = data.cards

const button = document.getElementById('draw')
// const fr = 'fr'
const en = 'en'
let deck = [...data.cards]
const max_rounds = 6;
let round = 0;
const rest_button = document.getElementById('reset')

// button.addEventListener('click', () => {
//   const i = Math.floor(Math.random() * cards.length);
//   const card = cards[i]
//   document.getElementById('year').textContent = card.year;
//   document.getElementById('title').textContent = card.title[en]; //signaler le parametre que je veux, EN card.title.en
//   document.getElementById('text').textContent = card.text[en];   //signaler le parametre que je veux, EN card.text.en
//   document.getElementById('source').href = card.source.url;
// })


button.addEventListener('click', () => {
  if (round >= max_rounds || deck.length === 0 ) return
  const i = Math.floor(Math.random() * deck.length);
  const [card] = deck.splice(i, 1);
  round++
  document.getElementById('round').textContent = `Round ${round} / ${max_rounds}`
  if (round === max_rounds) {
    button.disabled = true
    rest_button.hidden = false
}
  document.getElementById('year').textContent = card.year;
  document.getElementById('title').textContent = card.title[en]; //signaler le parametre que je veux, EN card.title.en
  document.getElementById('text').textContent = card.text[en];   //signaler le parametre que je veux, EN card.text.en
  document.getElementById('source').href = card.source.url;
})

rest_button.addEventListener('click', () => {
  deck = [...data.cards];
  round = 0
  button.disabled = false;
  rest_button.hidden = true;

  document.getElementById('year').textContent = ""
  document.getElementById('title').textContent =  ""
  document.getElementById('text').textContent =  ""
  document.getElementById('source').href = ""
})

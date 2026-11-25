import data from '../data/cards.json'
// const cards = data.cards

const button = document.getElementById('draw')
// const fr = 'fr'
const en = 'en'
let deck = [...data.cards]

// button.addEventListener('click', () => {
//   const i = Math.floor(Math.random() * cards.length);
//   const card = cards[i]
//   document.getElementById('year').textContent = card.year;
//   document.getElementById('title').textContent = card.title[en]; //signaler le parametre que je veux, EN card.title.en
//   document.getElementById('text').textContent = card.text[en];   //signaler le parametre que je veux, EN card.text.en
//   document.getElementById('source').href = card.source.url;
// })


button.addEventListener('click', () => {
  const i = Math.floor(Math.random() * deck.length);
  const [card] = deck.splice(i, 1);
  document.getElementById('year').textContent = card.year;
  document.getElementById('title').textContent = card.title[en]; //signaler le parametre que je veux, EN card.title.en
  document.getElementById('text').textContent = card.text[en];   //signaler le parametre que je veux, EN card.text.en
  document.getElementById('source').href = card.source.url;
})

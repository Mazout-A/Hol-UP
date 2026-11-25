import cards from '../data/cards.json'

const button = document.getElementById('draw')
const fr = 'fr'
const en = 'en'

button.addEventListener('click', () => {
  const i = Math.floor(Math.random() * cards.length);
  const card = cards[i]
  document.getElementById('year').textContent = card.year;
  document.getElementById('title').textContent = card.title[en]; //signaler le parametre que je veux, EN card.title.en
  document.getElementById('text').textContent = card.text[en];   //signaler le parametre que je veux, EN card.text.en
  document.getElementById('source').href = card.source.url;
})

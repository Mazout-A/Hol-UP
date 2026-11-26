import data from '../data/cards.json'
import { createIcons, Calendar, Gauge, BookOpen, ChartLine, House, ShieldCheck, TrendingUp, TrendingDown, RotateCcw } from 'lucide'
////////////////////////////////////////////


const icons = { Calendar, Gauge, BookOpen, ChartLine, House, ShieldCheck, TrendingUp, TrendingDown, RotateCcw };
createIcons({ icons });

const button = document.getElementById('draw');
const en = 'en';
const rest_button = document.getElementById('reset');
const max_rounds = 6;
const video_frame = document.getElementById('video')
////////////////////////////////////////////


let round = 0;
let deck = [...data.cards];
////////////////////////////////////////////


button.addEventListener('click', () => {
  if (round >= max_rounds || deck.length === 0 ) return
  const i = Math.floor(Math.random() * deck.length);
  const [card] = deck.splice(i, 1);
  const category = data.categories[card.category]
  const sign = card.score > 0 ? '+' : ''
  const source = document.getElementById('source')

  document.getElementById('card').dataset.sentiment = card.score > 0 ? 'positive' : 'negative'
  document.getElementById('card').hidden = false
  document.getElementById('category-icon').innerHTML = `<i data-lucide="${category.icon}"></i>`
  document.getElementById('trend-icon').innerHTML = `<i data-lucide="${category.trendIcon}"></i>`
  createIcons({ icons })


  round++
  document.getElementById('round').textContent = `Round ${round} / ${max_rounds}`


  if (round === max_rounds) {
    button.disabled = true
    rest_button.hidden = false
  }


  document.getElementById('year').textContent = card.year;
  document.getElementById('title').textContent = card.title[en];
  document.getElementById('text').textContent = card.text[en];


  source.href = card.source.url
  source.textContent = new URL(card.source.url).hostname.replace('www.', '')
  source.title = card.source.name

  document.getElementById('date').textContent = card.date


  document.getElementById('score').textContent = `${sign}${card.score}`
  document.getElementById('score-label').textContent = category.label[en]

  if (card.video && card.video.url.includes('youtube.com')) {
    const video_id = new URL(card.video.url).searchParams.get('v')
    video_frame.src = `https://www.youtube-nocookie.com/embed/${video_id}`
    video_frame.hidden = false
  } else {
    video_frame.hidden = true
    video_frame.src = ''
  }
})
////////////////////////////////////////////


rest_button.addEventListener('click', () => {
  deck = [...data.cards];
  round = 0
  button.disabled = false;
  rest_button.hidden = true;
  video_frame.hidden = true
  video_frame.src = ''

  document.getElementById('category-icon').innerHTML = ""
  document.getElementById('trend-icon').innerHTML = ""
  document.getElementById('round').textContent = ""
  document.getElementById('year').textContent = ""
  document.getElementById('title').textContent =  ""
  document.getElementById('text').textContent =  ""
  document.getElementById('date').textContent = ""
  document.getElementById('score').textContent = ""
  document.getElementById('score-label').textContent = ""
  document.getElementById('source').href = ""
  document.getElementById('card').hidden = true
})

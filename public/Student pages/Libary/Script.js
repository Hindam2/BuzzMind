const MY_QUIZZES_PREVIEW_COUNT = 3;

const CARD_THEMES = [
  { imageClass: 'science', badgeClass: 'science-tag', badge: 'PLAYED' },
  { imageClass: 'tech', badgeClass: 'tech-tag', badge: 'PLAYED' },
  { imageClass: 'art', badgeClass: 'art-tag', badge: 'PLAYED' },
];

let allMyQuizzes = [];
let showingAllMyQuizzes = false;

function formatPlayedDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function createQuizCard(entry, index) {
  const theme = CARD_THEMES[index % CARD_THEMES.length];
  const card = document.createElement('article');
  card.className = 'quiz-card';
  card.dataset.title = (entry.quizTitle || '').toLowerCase();

  const image = document.createElement('div');
  image.className = `card-image ${theme.imageClass}`;

  const badge = document.createElement('span');
  badge.className = `badge ${theme.badgeClass}`;
  badge.textContent = theme.badge;
  image.appendChild(badge);

  const info = document.createElement('div');
  info.className = 'card-info';

  const title = document.createElement('h3');
  title.textContent = entry.quizTitle || 'Untitled quiz';

  const meta = document.createElement('p');
  const dateLabel = formatPlayedDate(entry.playedAt);
  meta.textContent = [
    `${entry.accuracy ?? 0}% accuracy`,
    `${Number(entry.score || 0).toLocaleString()} pts`,
    entry.totalQuestions ? `${entry.totalQuestions} questions` : null,
    dateLabel,
  ]
    .filter(Boolean)
    .join(' · ');

  info.appendChild(title);
  info.appendChild(meta);
  card.appendChild(image);
  card.appendChild(info);

  return card;
}

function updateViewAllButton() {
  const btn = document.getElementById('viewAllMyQuizzes');
  if (!btn) return;

  const total = allMyQuizzes.length;
  if (total <= MY_QUIZZES_PREVIEW_COUNT) {
    btn.hidden = true;
    return;
  }

  btn.hidden = false;
  if (showingAllMyQuizzes) {
    btn.textContent = 'Show less';
    btn.setAttribute('aria-expanded', 'true');
  } else {
    btn.textContent = `View all (${total})`;
    btn.setAttribute('aria-expanded', 'false');
  }
}

function isCardVisibleInPreview(index) {
  return showingAllMyQuizzes || index < MY_QUIZZES_PREVIEW_COUNT;
}

function renderMyQuizzes(entries) {
  const grid = document.getElementById('myQuizzes');
  if (!grid) return;

  allMyQuizzes = entries;
  grid.innerHTML = '';

  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'library-empty';
    empty.innerHTML =
      '<span class="library-empty-icon">📭</span>' +
      '<strong>You haven\'t taken any quizzes yet</strong>' +
      '<span>Join a live game from Discover. After your professor ends the session, your quizzes will appear here.</span>';
    grid.appendChild(empty);
    updateViewAllButton();
    return;
  }

  entries.forEach((entry, i) => {
    const card = createQuizCard(entry, i);
    if (!isCardVisibleInPreview(i)) {
      card.classList.add('quiz-card-hidden');
      card.hidden = true;
    }
    grid.appendChild(card);
  });

  updateViewAllButton();
  applySearchFilter();
}

function toggleViewAllMyQuizzes() {
  showingAllMyQuizzes = !showingAllMyQuizzes;
  const grid = document.getElementById('myQuizzes');
  if (!grid) return;

  grid.querySelectorAll('.quiz-card').forEach((card, i) => {
    const show = isCardVisibleInPreview(i);
    card.hidden = !show;
    card.classList.toggle('quiz-card-hidden', !show);
  });

  updateViewAllButton();
  applySearchFilter();
}

function applySearchFilter() {
  const searchInput = document.getElementById('quizSearch');
  const grid = document.getElementById('myQuizzes');
  if (!searchInput || !grid) return;

  const term = searchInput.value.toLowerCase().trim();
  grid.querySelectorAll('.quiz-card').forEach((card, i) => {
    const title = card.dataset.title || '';
    const matchesSearch = !term || title.includes(term);
    const inPreview = isCardVisibleInPreview(i);
    const visible = matchesSearch && inPreview;
    card.hidden = !visible;
    card.classList.toggle('quiz-card-hidden', !visible);
  });
}

function setupSearch() {
  const searchInput = document.getElementById('quizSearch');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim();
    if (term && !showingAllMyQuizzes && allMyQuizzes.length > MY_QUIZZES_PREVIEW_COUNT) {
      showingAllMyQuizzes = true;
      renderMyQuizzes(allMyQuizzes);
    }
    applySearchFilter();
  });
}

function setupViewAllButton() {
  const btn = document.getElementById('viewAllMyQuizzes');
  if (!btn) return;
  btn.addEventListener('click', toggleViewAllMyQuizzes);
}

async function loadMyQuizzes() {
  const grid = document.getElementById('myQuizzes');
  if (!grid) return;

  showingAllMyQuizzes = false;

  if (typeof BuzzMindAPI === 'undefined') {
    grid.innerHTML = '<p class="library-empty">Unable to load quizzes.</p>';
    return;
  }

  try {
    const results = await BuzzMindAPI.getReports();
    const list = Array.isArray(results) ? results : [];
    renderMyQuizzes(list);
    setupSearch();
  } catch (err) {
    console.error('Failed to load library quizzes:', err);
    grid.innerHTML =
      '<p class="library-empty">Could not load your quizzes. Make sure you are logged in as a student.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupViewAllButton();
  loadMyQuizzes();
});

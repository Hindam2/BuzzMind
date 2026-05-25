const pinFromUrl = new URLSearchParams(window.location.search).get('pin');
const gamePin = pinFromUrl || sessionStorage.getItem('gamePin') || '';

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function renderPlayers(players = []) {
  const grid = document.querySelector('.players-grid');
  if (!grid) return;
  grid.innerHTML = '';

  players.forEach((player) => {
    const card = document.createElement('div');
    card.className = 'player-card';
    card.textContent = player.displayName || 'Player';
    grid.appendChild(card);
  });

  setText('.players-count', players.length);
}

function goToQuiz(sessionId) {
  if (!sessionId) return;
  window.location.href = `/Quiz/student-quiz.html?session=${sessionId}`;
}

async function refreshLobby() {
  if (!gamePin || typeof BuzzMindAPI === 'undefined') return;

  try {
    const session = await BuzzMindAPI.getSessionByPin(gamePin);
    sessionStorage.setItem('gameSessionId', session.sessionId);
    setText('.pin-number', session.pinFormatted || gamePin);
    setText('.status-pill', session.status === 'active' ? 'QUIZ STARTED' : 'WAITING FOR PLAYERS...');
    renderPlayers(session.players || []);

    if (session.status === 'active') {
      goToQuiz(session.sessionId);
    }
  } catch (err) {
    setText('.status-pill', err.message || 'SESSION NOT FOUND');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setText('.pin-number', gamePin ? gamePin.replace(/(\d{3})(\d{3})/, '$1 $2') : '---');

  document.getElementById('start-quiz-btn')?.addEventListener('click', () => {
    goToQuiz(sessionStorage.getItem('gameSessionId'));
  });

  refreshLobby();
  setInterval(refreshLobby, 2000);
});

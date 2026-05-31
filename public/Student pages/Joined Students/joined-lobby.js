const params = new URLSearchParams(window.location.search);
const pinFromUrl = params.get('pin');
const sessionFromUrl = params.get('session');
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
    const sessionId = sessionFromUrl || session.sessionId;
    sessionStorage.setItem('gameSessionId', sessionId);
    setText('.pin-number', session.pinFormatted || gamePin);
    setText('.status-pill', session.status === 'active' ? 'QUIZ STARTED' : 'WAITING FOR PROFESSOR TO START...');
    renderPlayers(session.players || []);
    if (session.status === 'active' && session.questionOpen) {
      goToQuiz(sessionId);
    }
  } catch (err) {
    setText('.status-pill', err.message || 'SESSION NOT FOUND');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setText('.pin-number', gamePin ? gamePin.replace(/(\d{3})(\d{3})/, '$1 $2') : '---');

  refreshLobby();
  setInterval(refreshLobby, 2000);
});

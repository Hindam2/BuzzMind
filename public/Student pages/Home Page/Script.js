// ---------- Join Game ----------

async function resolveDisplayName() {
  const nameInput = document.getElementById('playerNameInput');
  const fromInput = (nameInput?.value || '').trim();

  if (typeof BuzzMindAPI !== 'undefined') {
    try {
      const me = await BuzzMindAPI.getMe();
      if (me?.role === 'student') {
        const accountName = (me.username || me.name || '').trim();
        return fromInput || accountName;
      }
      // Professor/admin: use only what they type (never their account username)
      return fromInput;
    } catch (_) {
      return fromInput || (sessionStorage.getItem('playerName') || '').trim();
    }
  }

  return fromInput || (sessionStorage.getItem('playerName') || '').trim();
}

async function prefillPlayerName() {
  const nameInput = document.getElementById('playerNameInput');
  if (!nameInput || typeof BuzzMindAPI === 'undefined') return;

  try {
    const me = await BuzzMindAPI.getMe();
    if (me?.role === 'student') {
      const accountName = (me.username || me.name || '').trim();
      if (accountName && !nameInput.value.trim()) {
        nameInput.value = accountName;
      }
      nameInput.placeholder = 'YOUR NAME (optional if logged in)';
    }
  } catch (_) {
    const saved = sessionStorage.getItem('playerName');
    if (saved && !nameInput.value.trim()) {
      nameInput.value = saved;
    }
  }
}

async function joinGame(event) {
  event.preventDefault();

  const input = document.getElementById('pinInput');
  const pin = input.value.trim().replace(/\s/g, '');

  if (!pin) {
    showPinError(input, 'Please enter a Game PIN.');
    return;
  }

  if (!/^\d{6}$/.test(pin)) {
    showPinError(input, 'PIN must be 6 digits.');
    return;
  }

  const btn = document.querySelector('.btn-join');
  btn.textContent = 'Joining...';
  btn.disabled = true;

  try {
    let displayName = await resolveDisplayName();

    if (!displayName) {
      showPinError(input, 'Enter your name above to join.');
      btn.textContent = 'Join';
      btn.disabled = false;
      document.getElementById('playerNameInput')?.focus();
      return;
    }

    displayName = displayName.slice(0, 50);
    sessionStorage.setItem('playerName', displayName);

    if (typeof BuzzMindAPI !== 'undefined') {
      const session = await BuzzMindAPI.joinSession(pin, displayName);
      sessionStorage.setItem('gameSessionId', session.sessionId);
      sessionStorage.setItem('gamePin', pin);
      if (session.playerId) {
        sessionStorage.setItem('playerId', session.playerId);
        if (Array.isArray(session.players) && session.players.length) {
          const p = session.players.find(
            (x) => String(x.id || x._id) === String(session.playerId),
          );
          const returnedName = p?.displayName || p?.name || '';
          if (returnedName) sessionStorage.setItem('playerName', returnedName);
        } else if (session.playerName) {
          sessionStorage.setItem('playerName', session.playerName);
        }
      }
      input.style.borderColor = '#10b981';
      setTimeout(() => {
        const query = new URLSearchParams({
          pin,
          session: session.sessionId,
        }).toString();
        window.location.href = `/Student pages/Joined Students/Joined Students.html?${query}`;
      }, 600);
      return;
    }

    if (pin !== '734912') {
      btn.textContent = 'Join';
      btn.disabled = false;
      showPinError(input, 'Wrong Game PIN.');
      return;
    }

    input.style.borderColor = '#10b981';
    setTimeout(() => {
      window.location.href = '/Student pages/Joined Students/Joined Students.html';
    }, 1000);
  } catch (err) {
    btn.textContent = 'Join';
    btn.disabled = false;
    showPinError(input, err.message || 'Invalid PIN');
  }
}

function showPinError(input, message) {
  input.style.borderColor = '#ef4444';
  input.value = '';
  input.placeholder = message;

  setTimeout(() => {
    input.style.borderColor = '';
    input.placeholder = 'GAME PIN';
  }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('pinInput');

  prefillPlayerName();

  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '');
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinGame(e);
  });

  const nameInput = document.getElementById('playerNameInput');
  if (nameInput) {
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') joinGame(e);
    });
  }
});

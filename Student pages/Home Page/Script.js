// ---------- Join Game ----------
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
    let displayName = sessionStorage.getItem('playerName');
    if (!displayName && typeof BuzzMindAPI !== 'undefined') {
      try {
        const me = await BuzzMindAPI.getMe();
        displayName = me.name;
      } catch (_) {
        displayName = null;
      }
    }
    if (!displayName) {
      displayName = prompt('Enter your display name:')?.trim();
    }
    if (!displayName) {
      btn.textContent = 'Join';
      btn.disabled = false;
      showPinError(input, 'Name is required.');
      return;
    }

    sessionStorage.setItem('playerName', displayName);

    if (typeof BuzzMindAPI !== 'undefined') {
      const session = await BuzzMindAPI.joinSession(pin, displayName);
      sessionStorage.setItem('gameSessionId', session.sessionId);
      sessionStorage.setItem('gamePin', pin);
      if (session.playerId) sessionStorage.setItem('playerId', session.playerId);
      input.style.borderColor = '#10b981';
      setTimeout(() => {
        window.location.href = `/Student pages/Joined Students/Joined Students.html?pin=${pin}`;
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
      window.location.href = '../Joined Students/Joined Students.html';
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

  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '');
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinGame(e);
  });
});

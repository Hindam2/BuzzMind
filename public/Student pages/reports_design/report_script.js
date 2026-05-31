const CORRECT_PIN = '1234';

// ── PIN modal ──
document.querySelector('#Enter-btn').addEventListener('click', () => {
  document.querySelector('#pin-input').value = '';
  document.querySelector('#pin-error').textContent = '';
  document.querySelector('#pin-modal').style.display = 'flex';
});

document.querySelector('.pin-confirm').addEventListener('click', () => {
  const input = document.querySelector('#pin-input').value.trim();
  const errorEl = document.querySelector('#pin-error');

  if (input === '') {
    errorEl.textContent = 'Please enter your PIN.';
    return;
  }

  if (!/^\d+$/.test(input)) {
    errorEl.textContent = 'PIN must contain numbers only.';
    return;
  }

  if (input !== CORRECT_PIN) {
    errorEl.textContent = 'Incorrect PIN. Please try again.';
    document.querySelector('#pin-input').value = '';
    return;
  }

  errorEl.textContent = '';
  document.querySelector('#pin-modal').style.display = 'none';
  alert('PIN accepted!');
});

// Scoped to only the PIN modal's cancel button
document
  .querySelector('#pin-modal .pin-cancel')
  .addEventListener('click', () => {
    document.querySelector('#pin-modal').style.display = 'none';
  });

// ── Details modal ──
const detailsModal = document.querySelector('#details-modal');
const detailsIcon = document.querySelector('#details-icon');
const detailsTitle = document.querySelector('#details-title');
const detailsMeta = document.querySelector('#details-meta');
const detailsPlayers = document.querySelector('#details-players');
const detailsAccuracy = document.querySelector('#details-accuracy');
const detailsScore = document.querySelector('#details-score');

document.querySelectorAll('.btn-details').forEach((btn) => {
  btn.addEventListener('click', () => {
    const row = btn.closest('.rs-row');

    detailsIcon.textContent = row.dataset.icon;
    detailsIcon.className = `rs-icon details-icon ${row.dataset.iconColor}`;
    detailsTitle.textContent = row.dataset.title;
    detailsMeta.textContent = row.dataset.meta;
    detailsPlayers.textContent = row.dataset.players;
    detailsAccuracy.textContent = row.dataset.accuracy;
    detailsScore.textContent = row.dataset.score;

    detailsModal.style.display = 'flex';
  });
});

document.querySelector('#details-close').addEventListener('click', () => {
  detailsModal.style.display = 'none';
});

// ── Archive modal ──
const archiveModal = document.querySelector('#archive-modal');

document.querySelector('#archive-close').addEventListener('click', () => {
  archiveModal.style.display = 'none';
});

// ── Close any modal by clicking the backdrop ──
document.querySelectorAll('.pin-modal').forEach((modal) => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });
});

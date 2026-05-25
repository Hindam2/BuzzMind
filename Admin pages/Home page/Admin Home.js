const AVATAR_COLORS = [
  'linear-gradient(135deg,#6b3a2a,#9b5a3a)',
  'linear-gradient(135deg,#1a2a4a,#2a3a6a)',
  'linear-gradient(135deg,#2d3a2a,#4a5a3a)',
  'linear-gradient(135deg,#3a2a4a,#5a3a6a)',
];

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildProfessorCard(prof) {
  const parts = prof.name.trim().split(' ');
  const initials = parts
    .filter((part) => /^[A-Za-z]/.test(part))
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const dept = (prof.department || 'GENERAL').toUpperCase();
  const bg = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const card = document.createElement('div');

  card.className = 'prof-card';
  if (prof.id) card.dataset.id = prof.id;
  card.style.cssText =
    'opacity:0;transform:translateY(20px);transition:opacity 0.4s,transform 0.4s';

  card.innerHTML = `
    <div class="prof-top">
      <div class="prof-av" style="background:${bg}">${escapeHTML(initials)}</div>
      <div class="prof-info">
        <div class="name-row">
          <h3>${escapeHTML(prof.name)}</h3>
          <span class="dept-badge cs">${escapeHTML(dept)}</span>
        </div>
        <div class="email">&#9993; ${escapeHTML(prof.email)}</div>
      </div>
    </div>
    <div class="prof-stats">
      <div class="pstat">
        <div class="pstat-lbl">TOTAL CLASSES</div>
        <div class="pstat-val">${String(prof.classCount || 0).padStart(2, '0')} <span class="dots blue-dots"></span></div>
      </div>
      <div class="pstat">
        <div class="pstat-lbl">TOTAL STUDENTS</div>
        <div class="pstat-val big">${prof.studentCount || 0}</div>
      </div>
    </div>
    <div class="card-foot">
      <a href="/Admin pages/prof dashboard/index.html"><button class="btn-view" type="button">View Details</button></a>
      <button class="btn-del" type="button">&#128465;</button>
    </div>`;

  card.querySelector('.btn-del').addEventListener('click', () => {
    deleteProfessor(card, prof.id, prof.name);
  });

  return card;
}

function appendProfessorCard(prof) {
  const grid = document.getElementById('profGrid');
  if (!grid) return;

  const card = buildProfessorCard(prof);
  grid.appendChild(card);
  setTimeout(() => {
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  }, 50);
}

async function loadProfessors() {
  const grid = document.getElementById('profGrid');
  if (!grid || typeof BuzzMindAPI === 'undefined') return;

  try {
    const professors = await BuzzMindAPI.getProfessors();
    grid.querySelectorAll('.prof-card').forEach((card) => card.remove());
    professors.forEach((prof, index) => {
      const card = buildProfessorCard(prof);
      grid.appendChild(card);
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 80);
    });
  } catch (err) {
    showToast(err.message || 'Could not load professors.', 'error');
  }
}

async function deleteProfessor(card, id, name) {
  if (!card) return;

  if (typeof BuzzMindAPI !== 'undefined' && id) {
    try {
      await BuzzMindAPI.deleteProfessor(id);
    } catch (err) {
      showToast(err.message || 'Could not remove professor.', 'error');
      return;
    }
  }

  card.style.transition = 'opacity 0.3s, transform 0.3s';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.95)';
  setTimeout(() => card.remove(), 300);
  showToast(`${name} removed.`);
}

function setFieldError(id, message) {
  const error = document.getElementById(id);
  if (error) error.textContent = message;
}

function setFormAlert(message, type = 'error') {
  const alert = document.getElementById('profFormAlert');
  if (!alert) return;

  alert.textContent = message;
  alert.className = message ? `form-alert show ${type}` : 'form-alert';
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('profToast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.className = 'toast';
  }, 2600);
}

function openAddProfessorModal() {
  const modal = document.getElementById('addProfessorModal');
  if (!modal) return;

  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  setFormAlert('');
  document.getElementById('profName')?.focus();
}

function closeAddProfessorModal() {
  const modal = document.getElementById('addProfessorModal');
  const form = document.getElementById('addProfessorForm');
  if (!modal) return;

  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  form?.reset();
  setFormAlert('');
  setFieldError('profNameError', '');
  setFieldError('profEmailError', '');
  setFieldError('profDeptError', '');
}

function validateProfessorForm(name, email) {
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  setFieldError('profNameError', name ? '' : 'Full name is required.');
  setFieldError('profEmailError', emailValid ? '' : 'Enter a valid email address.');
  setFieldError('profDeptError', '');

  return Boolean(name && emailValid);
}

async function createProfessor({ name, email, department }) {
  const payload = {
    name: name.trim(),
    email: email.trim(),
    department: department.trim() || 'GENERAL',
  };

  if (typeof BuzzMindAPI !== 'undefined') {
    const prof = await BuzzMindAPI.createProfessor(payload);
    appendProfessorCard({
      id: prof.id,
      name: prof.name,
      email: prof.email,
      department: prof.department,
      classCount: 0,
      studentCount: 0,
    });
  } else {
    appendProfessorCard({
      id: null,
      ...payload,
      classCount: 0,
      studentCount: 0,
    });
  }
}

document.getElementById('searchInput')?.addEventListener('input', function () {
  const q = this.value.toLowerCase();
  document.querySelectorAll('.prof-card').forEach((card) => {
    const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
    const dept = card.querySelector('.dept-badge')?.textContent.toLowerCase() || '';
    card.style.display = name.includes(q) || dept.includes(q) ? '' : 'none';
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('addProfessorForm');
  const submitButton = document.getElementById('submitAddProfessor');

  document.getElementById('openAddProfessor')?.addEventListener('click', openAddProfessorModal);
  document.getElementById('closeAddProfessor')?.addEventListener('click', closeAddProfessorModal);
  document.getElementById('cancelAddProfessor')?.addEventListener('click', closeAddProfessorModal);
  document.getElementById('addProfessorModal')?.addEventListener('click', (event) => {
    if (event.target.id === 'addProfessorModal') closeAddProfessorModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAddProfessorModal();
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('profName')?.value.trim() || '';
    const email = document.getElementById('profEmail')?.value.trim() || '';
    const department = document.getElementById('profDept')?.value.trim() || '';

    setFormAlert('');
    if (!validateProfessorForm(name, email)) return;

    submitButton.disabled = true;
    submitButton.textContent = 'Adding...';

    try {
      await createProfessor({ name, email, department });
      closeAddProfessorModal();
      showToast('Professor added successfully.');
    } catch (err) {
      setFormAlert(err.message || 'Could not add professor. Please try again.');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Add Professor';
    }
  });

  loadProfessors();

  document.querySelectorAll('.prof-card, .stat-pill').forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

    const watcher = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, index * 80);
          watcher.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );

    watcher.observe(el);
  });
});

let students = [];
let editingId = null;
let classId = null;
let drafts = [];

function getClassIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('classId');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidName(name) {
  return /^[a-zA-Z\s\-']{2,}$/.test(name);
}

function showError(id, message) {
  document.querySelector(id).textContent = message;
}

function clearErrors(...ids) {
  ids.forEach((id) => (document.querySelector(id).textContent = ''));
}

function escapeHTML(value) {
  if (window.Dash?.escapeHTML) return window.Dash.escapeHTML(value);
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initials(name) {
  if (window.Dash?.initials) return window.Dash.initials(name);
  return (
    String(name || '?')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '?'
  );
}

function gradeClass(g) {
  if (g >= 85) return 'grade-high';
  if (g >= 70) return 'grade-mid';
  return 'grade-low';
}

function participationBars(count) {
  let bars = '';
  for (let i = 1; i <= 4; i++) {
    const h = 8 + i * 5;
    bars += `<div class="bar ${i <= count ? '' : 'empty'}" style="height:${h}px"></div>`;
  }
  return `<div class="participation-bars">${bars}</div>`;
}

function mapStudent(s) {
  return {
    id: s._id,
    name: s.name,
    email: s.email,
    grade: s.grade,
    participation: s.participation,
    emoji: s.emoji || '',
  };
}

function setDraftMessage(message, type = '') {
  const msg = document.querySelector('#draft-launch-msg');
  if (!msg) return;
  msg.textContent = message || '';
  msg.className = `draft-launch-msg${type ? ` ${type}` : ''}`;
}

function setDraftControlsDisabled(disabled) {
  const launchBtn = document.querySelector('#launch-draft-btn');
  const refreshBtn = document.querySelector('#refresh-drafts-btn');
  if (launchBtn) launchBtn.disabled = disabled || drafts.length === 0;
  if (refreshBtn) refreshBtn.disabled = disabled;
}

function draftMeta(quiz) {
  const count = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
  const label = count === 1 ? 'question' : 'questions';
  return `${quiz.title || 'Untitled draft'} - ${count} ${label}`;
}

function renderDrafts() {
  const select = document.querySelector('#draft-select');
  if (!select) return;

  select.innerHTML = '';
  if (!drafts.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No draft quizzes found';
    select.appendChild(option);
    setDraftControlsDisabled(false);
    document.querySelector('#launch-draft-btn').disabled = true;
    return;
  }

  drafts.forEach((quiz) => {
    const option = document.createElement('option');
    option.value = quiz._id;
    option.textContent = draftMeta(quiz);
    select.appendChild(option);
  });
  setDraftControlsDisabled(false);
}

async function loadDrafts() {
  const select = document.querySelector('#draft-select');
  if (!select || typeof BuzzMindAPI === 'undefined') return;

  setDraftMessage('Loading your draft quizzes...');
  setDraftControlsDisabled(true);
  try {
    const list = await BuzzMindAPI.getQuizzes({ status: 'draft' });
    drafts = Array.isArray(list) ? list : [];
    renderDrafts();
    setDraftMessage(
      drafts.length
        ? 'Choose a draft, then attach it to this class.'
        : 'No drafts yet. Save a draft from Quiz Builder first.',
    );
  } catch (err) {
    drafts = [];
    renderDrafts();
    setDraftMessage(err.message || 'Could not load draft quizzes.', 'error');
  }
}

function showLaunchResult(session) {
  const card = document.querySelector('#live-session-card');
  const pin = document.querySelector('#launched-pin');
  const lobby = document.querySelector('#open-prof-lobby');
  if (!card || !pin || !lobby) return;

  const lobbyUrl = `/Quiz/professor-quiz.html?session=${encodeURIComponent(session.sessionId)}`;
  pin.textContent = session.pinFormatted || session.pin || '---';
  lobby.href = lobbyUrl;
  card.hidden = false;
}

async function launchSelectedDraft() {
  const select = document.querySelector('#draft-select');
  const quizId = select?.value;
  classId = classId || getClassIdFromUrl();

  if (!classId) {
    setDraftMessage('Open this page from a class before launching a quiz.', 'error');
    return;
  }
  if (!quizId) {
    setDraftMessage('Choose a draft quiz first.', 'error');
    return;
  }

  setDraftControlsDisabled(true);
  setDraftMessage('Attaching draft and creating live session...');
  try {
    const session = await BuzzMindAPI.launchQuiz(quizId, { classId });
    sessionStorage.setItem('gameSessionId', session.sessionId);
    sessionStorage.setItem('gamePin', session.pin);
    showLaunchResult(session);
    drafts = drafts.filter((quiz) => String(quiz._id) !== String(quizId));
    renderDrafts();
    setDraftMessage('Live lobby created. Taking you there now...', 'success');
    setTimeout(() => {
      window.location.href = `/Quiz/professor-quiz.html?session=${encodeURIComponent(session.sessionId)}`;
    }, 900);
  } catch (err) {
    setDraftMessage(err.message || 'Could not launch this draft.', 'error');
  } finally {
    setDraftControlsDisabled(false);
  }
}

function renderRoster(list) {
  const tbody = document.querySelector('#roster-body');
  tbody.innerHTML = '';

  list.forEach((s) => {
    const tr = document.createElement('tr');
    const avatar = s.emoji || initials(s.name);
    tr.innerHTML = `
      <td>
        <div class="student-info">
          <div class="student-avatar">${escapeHTML(avatar)}</div>
          <div>
            <div class="student-name">${escapeHTML(s.name)}</div>
            <div class="student-email">${escapeHTML(s.email)}</div>
          </div>
        </div>
      </td>
      <td><span class="grade-badge ${gradeClass(s.grade)}">${escapeHTML(s.grade)}%</span></td>
      <td>${participationBars(s.participation)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-delete" data-id="${escapeHTML(s.id)}" type="button">Delete</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  document.querySelector('#roster-count').textContent =
    `Showing ${list.length} of ${students.length} students`;

  document.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (classId && typeof BuzzMindAPI !== 'undefined') {
        try {
          const cls = await BuzzMindAPI.deleteStudent(classId, id);
          students = cls.students.map(mapStudent);
        } catch (err) {
          console.error(err);
          return;
        }
      } else {
        students = students.filter((s) => s.id !== id);
      }
      renderRoster(students);
    });
  });
}

async function loadClassRoster() {
  classId = getClassIdFromUrl();
  if (!classId || typeof BuzzMindAPI === 'undefined') {
    students = [
      {
        id: '1',
        name: 'Alex "Neutron" Rivera',
        email: 'alex.rivera@buzzmind.com',
        grade: 94,
        participation: 4,
        emoji: '',
      },
      {
        id: '2',
        name: 'Luna Stark',
        email: 'luna.stark@buzzmind.com',
        grade: 89,
        participation: 3,
        emoji: '',
      },
    ];
    renderRoster(students);
    return;
  }

  try {
    const cls = await BuzzMindAPI.getClass(classId);
    students = cls.students.map(mapStudent);
    const title = document.querySelector('.page-title, h1, .class-title, .current-class-name');
    if (title) title.textContent = cls.name;
    const enrolled = document.querySelector('.enrolled-badge');
    if (enrolled) enrolled.textContent = `${students.length} Enrolled`;
    renderRoster(students);
  } catch (err) {
    console.error(err);
    renderRoster([]);
  }
}

document.querySelector('#search-input')?.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  renderRoster(
    students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    ),
  );
});

document.querySelector('#refresh-drafts-btn')?.addEventListener('click', loadDrafts);
document.querySelector('#launch-draft-btn')?.addEventListener('click', launchSelectedDraft);

const addModal = document.querySelector('#add-modal');

document.querySelector('#add-student-btn').onclick = () => {
  addModal.style.display = 'flex';
};

document.querySelector('#cancel-add').onclick = () => {
  addModal.style.display = 'none';
};

document.querySelector('#confirm-add').onclick = async () => {
  const name = document.querySelector('#new-name').value.trim();
  const email = document.querySelector('#new-email').value.trim();

  clearErrors('#add-name-error', '#add-email-error');

  if (!isValidName(name)) {
    showError('#add-name-error', 'Invalid name');
    return;
  }
  if (!isValidEmail(email)) {
    showError('#add-email-error', 'Invalid email');
    return;
  }

  if (classId && typeof BuzzMindAPI !== 'undefined') {
    try {
      const cls = await BuzzMindAPI.addStudent(classId, { name, email });
      students = cls.students.map(mapStudent);
    } catch (err) {
      showError('#add-email-error', err.message);
      return;
    }
  } else {
    students.push({
      id: String(Date.now()),
      name,
      email,
      grade: 80,
      participation: 3,
      emoji: '',
    });
  }

  addModal.style.display = 'none';
  document.querySelector('#new-name').value = '';
  document.querySelector('#new-email').value = '';
  renderRoster(students);
};

document.querySelectorAll('.modal-overlay').forEach((m) => {
  m.onclick = (e) => {
    if (e.target === m) m.style.display = 'none';
  };
});

document.addEventListener('DOMContentLoaded', async () => {
  if (window.Dash?.boot) await window.Dash.boot('classes');
  await loadClassRoster();
  await loadDrafts();
});

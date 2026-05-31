let students = [];
let editingId = null;
let classId = null;

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

function renderRoster(list) {
  const tbody = document.querySelector('#roster-body');
  tbody.innerHTML = '';

  list.forEach((s) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="student-info">
          <div class="student-avatar">${s.emoji}</div>
          <div>
            <div class="student-name">${s.name}</div>
            <div class="student-email">${s.email}</div>
          </div>
        </div>
      </td>
      <td><span class="grade-badge ${gradeClass(s.grade)}">${s.grade}%</span></td>
      <td>${participationBars(s.participation)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-delete" data-id="${s.id}">Delete</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  document.querySelector('#roster-count').textContent =
    `SHOWING ${list.length} OF ${students.length} STUDENTS`;

  document.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (classId && typeof BuzzMindAPI !== 'undefined') {
        try {
          const cls = await BuzzMindAPI.deleteStudent(classId, id);
          students = cls.students.map(mapStudent);
        } catch (err) {
          alert(err.message);
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
    const title = document.querySelector('.page-title, h1, .class-title');
    if (title) title.textContent = cls.name;
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

document.addEventListener('DOMContentLoaded', loadClassRoster);

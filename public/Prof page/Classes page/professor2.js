
// ---------- Search ----------
document.getElementById('searchInput').addEventListener('input', function () {
  const q = this.value.toLowerCase();
  document.querySelectorAll('.cc').forEach(card => {
    const name = card.querySelector('h3').textContent.toLowerCase();
    card.style.display = name.includes(q) ? '' : 'none';
  });
});


// ---------- Add New Class ----------
function openClassModal() {
  const modal = document.getElementById('class-modal');
  const input = document.getElementById('class-name-input');
  const error = document.getElementById('class-name-error');
  if (error) error.textContent = '';
  modal?.classList.add('open');
  modal?.setAttribute('aria-hidden', 'false');
  setTimeout(() => input?.focus(), 0);
}

function closeClassModal() {
  const modal = document.getElementById('class-modal');
  const input = document.getElementById('class-name-input');
  const error = document.getElementById('class-name-error');
  modal?.classList.remove('open');
  modal?.setAttribute('aria-hidden', 'true');
  if (input) input.value = '';
  if (error) error.textContent = '';
}

async function createClassFromModal() {
  const input = document.getElementById('class-name-input');
  const error = document.getElementById('class-name-error');
  const name = input?.value.trim();

  if (!name) {
    if (error) error.textContent = 'Class name is required.';
    return;
  }

  if (typeof BuzzMindAPI !== 'undefined') {
    try {
      const cls = await BuzzMindAPI.createClass({ name });
      appendClassCard(cls);
      closeClassModal();
      return;
    } catch (err) {
      if (error) {
        error.textContent =
          err.message ||
          'Could not create class. Make sure you are logged in as a professor.';
      }
      return;
    }
  }

  appendClassCard({ name, schedule: 'Schedule TBD', level: 'LEVEL 100', progress: 0, students: [] });
  closeClassModal();
}

window.addNewClass = openClassModal;
function buildManageHref(classId = '') {
  const basePath = '/Prof page/classes_design/classes_page.html';
  if (!classId) return basePath;
  const query = new URLSearchParams({ classId: String(classId) }).toString();
  return `${basePath}?${query}`;
}

function manage(_className, classId = '') {
  window.location.href = buildManageHref(classId);
}

window.manage = manage;

function appendClassCard(cls) {
  const grid = document.getElementById('cgrid');
  const card = document.createElement('div');
  card.className = 'cc';
  if (cls._id) card.dataset.id = cls._id;

  const count = cls.students?.length || 0;
  const progress = cls.progress || 0;
  const classId = cls._id || '';
  const manageHref = buildManageHref(classId);

  card.style.cssText = 'opacity:0;transform:translateY(20px);transition:opacity 0.4s,transform 0.4s';

  card.innerHTML = `
    <div class="ct" style="background:linear-gradient(135deg,#0f2027,#203a43)">
      <div class="ct-ov"></div>
      <span class="lvl">${cls.level || 'LEVEL 100'}</span>
    </div>
    <div class="cb">
      <h3>${cls.name}</h3>
      <p class="sch">${cls.schedule || 'Schedule TBD'}</p>
      <div class="pr"><span class="pl">COURSE PROGRESS</span><span class="pp">${progress}%</span></div>
      <div class="pbar"><div class="pf pf-g" style="width:${progress}%"></div></div>
      <div class="cf">
        <span class="stc">${count} Students</span>
        <div class="class-actions">
          <button class="delete-class-btn" type="button">Delete</button>
          <button class=\"mbtn manage-class-btn\" type=\"button\">Manage</button>
        </div>
      </div>
    </div>`;

  const pbar = card.querySelector('.pbar');
  if (pbar) pbar.innerHTML = `<div class="pf pf-g" style="width:${progress}%"></div>`;
  card.querySelector('.delete-class-btn')?.addEventListener('click', () => {
    deleteClassCard(card, cls);
  });
  card.querySelector('.manage-class-btn')?.addEventListener('click', () => {
    window.location.href = manageHref;
  });

  grid.appendChild(card);

  setTimeout(() => {
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  }, 50);
}

async function deleteClassCard(card, cls) {
  if (!confirm(`Delete "${cls.name}"?`)) return;

  if (cls._id && typeof BuzzMindAPI !== 'undefined') {
    try {
      await BuzzMindAPI.deleteClass(cls._id);
    } catch (err) {
      alert(err.message || 'Could not delete class');
      return;
    }
  }

  card.remove();
}

async function loadClassesFromApi() {
  if (typeof BuzzMindAPI === 'undefined') return;
  try {
    const classes = await BuzzMindAPI.getClasses();
    const grid = document.getElementById('cgrid');
    grid.querySelectorAll('.cc').forEach((el) => el.remove());
    classes.forEach((cls) => appendClassCard(cls));
  } catch (err) {
    console.error('Failed to load classes:', err);
  }
}

// ---------- Scroll-in animation ----------
document.addEventListener('DOMContentLoaded', async () => {
  const addClassButton = document.getElementById('add-class-btn');
  addClassButton?.addEventListener('click', openClassModal);
  document
    .getElementById('create-class-confirm')
    ?.addEventListener('click', createClassFromModal);
  document
    .getElementById('cancel-class-modal')
    ?.addEventListener('click', closeClassModal);
  document
    .getElementById('close-class-modal')
    ?.addEventListener('click', closeClassModal);
  document.getElementById('class-modal')?.addEventListener('click', (event) => {
    if (event.target.id === 'class-modal') closeClassModal();
  });
  document.getElementById('class-name-input')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') createClassFromModal();
    if (event.key === 'Escape') closeClassModal();
  });

  if (typeof BuzzMindAPI !== 'undefined') {
    try {
      const me = await BuzzMindAPI.getMe();
      const profName = document.querySelector('.prof-name');
      if (profName) profName.textContent = me.name || 'Professor';
    } catch (_) {
      /* not logged in */
    }
    await loadClassesFromApi();
  }

  document.querySelectorAll('.sc, .cc').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

    const watcher = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, i * 80);
        watcher.unobserve(el);
      }
    }, { threshold: 0.1 });

    watcher.observe(el);
  });
});

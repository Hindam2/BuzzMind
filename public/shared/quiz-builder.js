/* Shared light-theme quiz builder — used by professor and admin QuizBuild pages.
   Requires buzzmind-api.js + shared/dashboard.js loaded first. */
(function () {
  if (typeof BuzzMindAPI === 'undefined' || typeof Dash === 'undefined') return;
  const E = Dash.escapeHTML;
  const container = document.getElementById('questionsContainer');
  if (!container) return;

  const LETTERS = ['A', 'B', 'C', 'D'];
  let questions = [];

  function blank() {
    return { text: '', imageUrl: '', answers: ['', '', '', ''], correctIndex: 0 };
  }

  function checkMark() {
    return `<span class="ic">${Dash.icon('check')}</span>`;
  }

  function questionHtml(q, i) {
    const choices = [0, 1, 2, 3]
      .map(
        (j) => `
        <div class="qb-choice ${q.correctIndex === j ? 'correct' : ''}" data-choice="${j}">
          <span class="lt">${LETTERS[j]}</span>
          <input type="text" data-answer="${j}" value="${E(q.answers[j])}" placeholder="Answer ${LETTERS[j]}…" />
          <button type="button" class="pick" data-act="pick" title="Mark as correct">${q.correctIndex === j ? checkMark() : ''}</button>
        </div>`,
      )
      .join('');
    const hasImg = !!q.imageUrl;
    return `<div class="card qb-q" data-idx="${i}">
      <div class="qb-q-head">
        <span class="qb-q-num">${i + 1}</span>
        <button type="button" class="btn btn-sm btn-danger" data-act="del" title="Delete question"><span class="ic">${Dash.icon('trash')}</span></button>
      </div>
      <textarea data-field="text" placeholder="Write your question here…">${E(q.text)}</textarea>
      <div class="qb-img-wrap">
        <img class="qb-img-prev" data-img src="${hasImg ? E(q.imageUrl) : ''}" alt="" style="display:${hasImg ? 'block' : 'none'}" />
        <label class="btn btn-sm">
          <span class="ic">${Dash.icon('image')}</span> <span data-imglabel>${hasImg ? 'Change image' : 'Add image'}</span>
          <input type="file" accept="image/*" data-act="img" style="display:none" />
        </label>
        <button type="button" class="btn btn-sm btn-ghost" data-act="imgremove" style="display:${hasImg ? 'inline-flex' : 'none'}">Remove</button>
      </div>
      <div class="qb-choices">${choices}</div>
    </div>`;
  }

  /* Pull current input values back into state before any re-render. */
  function syncFromDom() {
    container.querySelectorAll('.qb-q').forEach((card) => {
      const i = Number(card.dataset.idx);
      const q = questions[i];
      if (!q) return;
      q.text = card.querySelector('[data-field="text"]').value;
      card.querySelectorAll('[data-answer]').forEach((inp) => {
        q.answers[Number(inp.dataset.answer)] = inp.value;
      });
    });
  }

  function render() {
    container.innerHTML = questions.map(questionHtml).join('');
  }

  container.addEventListener('click', (e) => {
    const card = e.target.closest('.qb-q');
    if (!card) return;
    const i = Number(card.dataset.idx);

    if (e.target.closest('[data-act="pick"]')) {
      const j = Number(e.target.closest('[data-choice]').dataset.choice);
      questions[i].correctIndex = j;
      card.querySelectorAll('[data-choice]').forEach((c) => {
        const cj = Number(c.dataset.choice);
        c.classList.toggle('correct', cj === j);
        c.querySelector('.pick').innerHTML = cj === j ? checkMark() : '';
      });
      return;
    }
    if (e.target.closest('[data-act="del"]')) {
      syncFromDom();
      questions.splice(i, 1);
      if (!questions.length) questions.push(blank());
      render();
      return;
    }
    if (e.target.closest('[data-act="imgremove"]')) {
      questions[i].imageUrl = '';
      const img = card.querySelector('[data-img]');
      img.src = '';
      img.style.display = 'none';
      card.querySelector('[data-imglabel]').textContent = 'Add image';
      card.querySelector('[data-act="imgremove"]').style.display = 'none';
    }
  });

  container.addEventListener('change', async (e) => {
    const fileInput = e.target.closest('[data-act="img"]');
    if (!fileInput || !fileInput.files || !fileInput.files[0]) return;
    const card = fileInput.closest('.qb-q');
    const i = Number(card.dataset.idx);
    try {
      const { url } = await BuzzMindAPI.uploadFile(fileInput.files[0]);
      questions[i].imageUrl = url;
      const img = card.querySelector('[data-img]');
      img.src = url;
      img.style.display = 'block';
      card.querySelector('[data-imglabel]').textContent = 'Change image';
      card.querySelector('[data-act="imgremove"]').style.display = 'inline-flex';
      Dash.toast('Image uploaded.');
    } catch (err) {
      Dash.toast(err.message || 'Image upload failed', 'error');
    } finally {
      fileInput.value = '';
    }
  });

  document.getElementById('addQuestionBtn').addEventListener('click', () => {
    syncFromDom();
    questions.push(blank());
    render();
    const last = container.querySelector('.qb-q:last-child textarea');
    if (last) last.focus();
  });

  function collect() {
    syncFromDom();
    const title = document.getElementById('quizTitle').value.trim();
    const totalTime = Number(document.getElementById('quizTime').value) || 20;
    if (!title) {
      Dash.toast('Quiz title is required.', 'error');
      return null;
    }
    const cleaned = [];
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      const text = q.text.trim();
      const answers = q.answers.map((a) => a.trim());
      if (!text) {
        Dash.toast(`Question ${i + 1} needs question text.`, 'error');
        return null;
      }
      if (answers.some((a) => !a)) {
        Dash.toast(`Question ${i + 1} needs all four answers.`, 'error');
        return null;
      }
      cleaned.push({
        text,
        imageUrl: q.imageUrl || null,
        answers,
        correctIndex: q.correctIndex,
      });
    }
    if (!cleaned.length) {
      Dash.toast('Add at least one question.', 'error');
      return null;
    }
    return { title, totalTime, questions: cleaned };
  }

  async function save(launch) {
    const payload = collect();
    if (!payload) return;
    const saveBtn = document.getElementById('saveBtn');
    const launchBtn = document.getElementById('launchBtn');
    saveBtn.disabled = true;
    launchBtn.disabled = true;
    try {
      const quiz = await BuzzMindAPI.createQuiz({ ...payload, status: 'published' });
      if (launch) {
        const session = await BuzzMindAPI.launchQuiz(quiz._id);
        Dash.toast('Quiz launched!');
        location.href = `/Quiz/professor-quiz.html?session=${encodeURIComponent(session.sessionId)}`;
      } else {
        Dash.toast('Quiz saved to your library.');
        questions = [blank()];
        document.getElementById('quizTitle').value = '';
        render();
      }
    } catch (err) {
      Dash.toast(err.message || 'Could not save quiz', 'error');
    } finally {
      saveBtn.disabled = false;
      launchBtn.disabled = false;
    }
  }

  document.getElementById('saveBtn').addEventListener('click', () => save(false));
  document.getElementById('launchBtn').addEventListener('click', () => save(true));

  questions = [blank()];
  render();
  Dash.boot('quiz');
})();

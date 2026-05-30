// =============================================
//  BuzzMind – quiz-builder.js  (no alerts/confirms)
// =============================================

let questionCount = 2;

/* ══ TOAST ══ */
function showToast(message, type = 'error') {
  const existing = document.getElementById('qb-toast');
  if (existing) existing.remove();

  const colors = {
    error: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
    success: { bg: '#f0fdf4', border: '#86efac', text: '#14532d' },
    warn: { bg: '#fefce8', border: '#fde047', text: '#92400e' },
  };
  const c = colors[type] || colors.error;

  const toast = document.createElement('div');
  toast.id = 'qb-toast';
  toast.style.cssText = `
    position:fixed;top:1.2rem;left:50%;
    transform:translateX(-50%) translateY(-20px);
    background:${c.bg};border:1.5px solid ${c.border};color:${c.text};
    padding:0.75rem 1.4rem;border-radius:12px;
    font-family:'DM Sans',sans-serif;font-weight:700;font-size:0.88rem;
    box-shadow:0 4px 20px rgba(0,0,0,0.12);z-index:9999;
    opacity:0;transition:opacity 0.3s,transform 0.3s;white-space:nowrap;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ══ CUSTOM CONFIRM DIALOG ══ */
function showConfirm(message, onConfirm) {
  if (!document.getElementById('dlg-style')) {
    const s = document.createElement('style');
    s.id = 'dlg-style';
    s.textContent = `
      @keyframes fadeIn  { from{opacity:0}to{opacity:1} }
      @keyframes slideUp { from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1} }
    `;
    document.head.appendChild(s);
  }

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(26,0,64,0.4);
    z-index:9998;display:flex;align-items:center;justify-content:center;
    animation:fadeIn 0.2s ease;
  `;

  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background:#fff;border-radius:18px;padding:2rem 2.2rem;
    max-width:360px;width:90%;
    box-shadow:0 8px 32px rgba(91,33,182,0.18);
    text-align:center;font-family:'DM Sans',sans-serif;
    animation:slideUp 0.2s ease;
  `;
  dialog.innerHTML = `
    <div style="font-size:2rem;margin-bottom:0.75rem"></div>
    <p style="font-size:0.92rem;color:#374151;font-weight:500;line-height:1.5;margin-bottom:1.4rem">${message}</p>
    <div style="display:flex;gap:0.75rem;justify-content:center">
      <button id="dlg-cancel" style="flex:1;padding:0.6rem;border-radius:10px;border:1.5px solid #d1d5db;background:#fff;color:#374151;font-weight:700;font-size:0.85rem;cursor:pointer;font-family:'DM Sans',sans-serif;">Cancel</button>
      <button id="dlg-confirm" style="flex:1;padding:0.6rem;border-radius:10px;background:#ef4444;color:#fff;font-weight:700;font-size:0.85rem;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;">Confirm</button>
    </div>`;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s';
    setTimeout(() => overlay.remove(), 200);
  };

  dialog.querySelector('#dlg-cancel').onclick = close;
  dialog.querySelector('#dlg-confirm').onclick = () => {
    close();
    onConfirm();
  };
  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };
}

/* ══ SELECT ANSWER ══ */
function selectAnswer(btn) {
  const block = btn.closest('.question-block');
  block.querySelectorAll('.choice-radio').forEach((r) => {
    r.classList.remove('correct');
    r.textContent = '';
    r.closest('.choice').classList.remove('selected');
  });
  btn.classList.add('correct');
  btn.textContent = '';
  btn.closest('.choice').classList.add('selected');
}

/* ══ DELETE QUESTION ══ */
function deleteQuestion(id) {
  const block = document.getElementById(id);
  if (!block) return;

  showConfirm('Are you sure you want to delete this question?', () => {
    block.style.transition = 'opacity 0.3s,transform 0.3s';
    block.style.opacity = '0';
    block.style.transform = 'scale(0.97)';
    setTimeout(() => block.remove(), 300);
    showToast('Question deleted.', 'warn');
  });
}

/* ══ ACTIVATE EMPTY BLOCK ══ */
function activateQuestion(id) {
  const block = document.getElementById(id);
  if (!block) return;

  const num = block.querySelector('.q-num').textContent;
  block.classList.remove('empty-block');
  block.innerHTML = `
    <div class="q-header">
      <div class="q-num">${num}</div>
      <div class="q-actions">
        <button class="q-btn" onclick="deleteQuestion('${id}')" title="Delete">Delete</button>
        <button class="q-btn" title="Drag">⠿</button>
      </div>
    </div>
    <textarea class="q-input" placeholder="Write your kinetic question here…"></textarea>
    <div class="q-image">
      <img class="q-image-preview" src="" alt="" style="display:none;max-width:320px;border-radius:8px;margin-top:0.6rem;" />
      <div class="q-image-controls" style="margin-top:0.4rem;">
        <input type="file" accept="image/*" onchange="handleImageChange(this, '${id}')" />
        <button type="button" class="btn-remove-image" onclick="removeImage('${id}')" style="display:none;margin-left:0.5rem;">Remove Image</button>
      </div>
    </div>
    <div class="choices-grid">
      <div class="choice red">
        <span class="choice-letter">A</span>
        <input type="text" placeholder="Add answer choice…" class="choice-input"/>
        <button class="choice-radio" onclick="selectAnswer(this)"></button>
      </div>
      <div class="choice green">
        <span class="choice-letter">B</span>
        <input type="text" placeholder="Add answer choice…" class="choice-input"/>
        <button class="choice-radio" onclick="selectAnswer(this)"></button>
      </div>
      <div class="choice yellow">
        <span class="choice-letter">C</span>
        <input type="text" placeholder="Add answer choice…" class="choice-input"/>
        <button class="choice-radio" onclick="selectAnswer(this)"></button>
      </div>
      <div class="choice blue">
        <span class="choice-letter">D</span>
        <input type="text" placeholder="Add answer choice…" class="choice-input"/>
        <button class="choice-radio" onclick="selectAnswer(this)"></button>
      </div>
    </div>`;

  addEmptyBlock();
}

/* ══ ADD EMPTY BLOCK ══ */
function addEmptyBlock() {
  questionCount++;
  const num = String(questionCount).padStart(2, '0');
  const id = 'q' + questionCount;

  const container = document.getElementById('questionsContainer');
  const block = document.createElement('div');
  block.className = 'question-block empty-block';
  block.id = id;
  block.style.cssText =
    'opacity:0;transform:translateY(20px);transition:opacity 0.4s,transform 0.4s';
  block.innerHTML = `
    <div class="q-header">
      <div class="q-num muted">${num}</div>
      <div class="q-actions">
        <button class="q-btn" onclick="deleteQuestion('${id}')" title="Delete">Delete</button>
      </div>
    </div>
    <div class="empty-body">
      <button class="add-q-circle" onclick="activateQuestion('${id}')">＋</button>
      <h3>Next Question</h3>
      <p>Keep the momentum going with another interactive block.</p>
      <button class="btn-add-q" onclick="activateQuestion('${id}')">Add Question Block</button>
    </div>`;

  container.appendChild(block);
  setTimeout(() => {
    block.style.opacity = '1';
    block.style.transform = 'translateY(0)';
  }, 50);
}

/* ══ ADD SEGMENT ══ */
function addSegment() {
  const bar = document.querySelector('.segment-bar');
  const seg = document.createElement('div');
  seg.className = 'seg active-seg';
  seg.style.cssText = 'opacity:0;transition:opacity 0.3s';
  bar.insertBefore(seg, bar.querySelector('.add-seg-btn'));
  setTimeout(() => {
    seg.style.opacity = '1';
  }, 50);
}

/* ══ COLLECT QUIZ DATA ══ */
function collectQuizPayload() {
  const title = document.getElementById('quizTitle').value.trim();
  const questions = [];

  document
    .querySelectorAll('.question-block:not(.empty-block)')
    .forEach((block) => {
      const text = block.querySelector('.q-input')?.value.trim();
      if (!text) return;

      const choices = block.querySelectorAll('.choice');
      const answers = [];
      let correctIndex = 0;
      choices.forEach((choice, i) => {
        answers.push(choice.querySelector('.choice-input')?.value.trim() || '');
        if (choice.querySelector('.choice-radio.correct')) correctIndex = i;
      });

      const imageUrl =
        block.dataset.imageUrl ||
        block.querySelector('.q-image-preview')?.src ||
        null;
      questions.push({
        text,
        imageUrl: imageUrl || null,
        answers,
        correctIndex,
      });
    });

  return { title, questions, totalTime: 20 };
}

/* ══ IMAGE UPLOAD HANDLERS ══ */
async function handleImageChange(input, id) {
  const file = input.files && input.files[0];
  if (!file) return;
  const block = document.getElementById(id);
  if (!block) return;

  try {
    const form = new FormData();
    form.append('file', file);

    const res = await fetch('/api/uploads', {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Upload failed');

    block.dataset.imageUrl = data.url;
    const img = block.querySelector('.q-image-preview');
    if (img) {
      img.src = data.url;
      img.style.display = 'block';
    }
    const rm = block.querySelector('.btn-remove-image');
    if (rm) rm.style.display = 'inline-block';
    showToast('Image uploaded', 'success');
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Image upload failed', 'error');
  }
}

function removeImage(id) {
  const block = document.getElementById(id);
  if (!block) return;
  delete block.dataset.imageUrl;
  const img = block.querySelector('.q-image-preview');
  if (img) {
    img.src = '';
    img.style.display = 'none';
  }
  const fileInput = block.querySelector('input[type="file"]');
  if (fileInput) fileInput.value = '';
  const rm = block.querySelector('.btn-remove-image');
  if (rm) rm.style.display = 'none';
  showToast('Image removed', 'warn');
}

/* ══ LAUNCH QUIZ ══ */
async function launchQuiz() {
  const payload = collectQuizPayload();

  if (!payload.title) {
    showToast('Please enter a quiz title before launching!', 'error');
    document.getElementById('quizTitle').focus();
    return;
  }
  if (payload.questions.length === 0) {
    showToast('Please write at least one question!', 'error');
    return;
  }
  if (payload.questions.some((q) => q.answers.some((a) => !a))) {
    showToast('Please fill in all answer choices!', 'error');
    return;
  }

  if (typeof BuzzMindAPI === 'undefined') {
    showToast('Quiz "' + payload.title + '" ready (offline mode)', 'success');
    return;
  }

  try {
    const quiz = await BuzzMindAPI.createQuiz(payload);
    const session = await BuzzMindAPI.launchQuiz(quiz._id);
    sessionStorage.setItem('gameSessionId', session.sessionId);
    sessionStorage.setItem('gamePin', session.pin);
    showToast(`Game PIN: ${session.pin}`, 'success');
    setTimeout(() => {
      window.location.href = `/Quiz/professor-quiz.html?session=${session.sessionId}`;
    }, 1200);
  } catch (err) {
    showToast(err.message || 'Failed to launch quiz', 'error');
  }
}

/* ══ DISCARD DRAFT ══ */
function discardDraft() {
  showConfirm('Discard this draft? All changes will be lost.', () => {
    document.getElementById('quizTitle').value = '';
    document.querySelectorAll('.q-input').forEach((q) => (q.value = ''));
    document.querySelectorAll('.choice-input').forEach((c) => (c.value = ''));
    document.querySelectorAll('.choice-radio.correct').forEach((r) => {
      r.classList.remove('correct');
      r.textContent = '';
      r.closest('.choice').classList.remove('selected');
    });
    showToast('Draft discarded.', 'warn');
  });
}

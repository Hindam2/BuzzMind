/* =============================================
   professor-quiz.js
   Handles the professor's quiz control view:
   - Shows current question (display only)
   - Simulates students submitting answers
   - Countdown timer (same as student view)
   - "Next Question" button controls flow
   - Live leaderboard updates
   ============================================= */

// ---- State ----
let currentQuestionIndex = 0;
let timerInterval = null;
let timeLeft = 0;
// Simulated submission count (in a real app this comes from the server)
let submittedCount = 0;
const TOTAL_STUDENTS = SESSION_STUDENTS.length;

// Copy student scores so we can simulate live updates
// (deep copy so we don't mutate the original)
const scores = SESSION_STUDENTS.map(s => ({ name: s.name, score: 0 }));

// ---- Start on page load ----
document.addEventListener('DOMContentLoaded', async () => {
  if (window.quizReady) await window.quizReady;
  if (window.LIVE_SESSION_ID && typeof BuzzMindAPI !== 'undefined') {
    try {
      const started = await BuzzMindAPI.startSession(window.LIVE_SESSION_ID);
      if (typeof started.currentQuestionIndex === 'number') {
        currentQuestionIndex = started.currentQuestionIndex;
      }
    } catch (err) {
      console.error('Failed to start live session:', err);
    }
  }
  loadProfQuestion(currentQuestionIndex);
});

/**
 * Load and display a question for the professor view.
 * @param {number} index
 */
function loadProfQuestion(index) {
  // Reset submission counter for this question
  submittedCount = 0;
  updateSubmittedDisplay();

  const question = QUIZ_DATA.questions[index];
  const total = QUIZ_DATA.questions.length;

  // Update badge
  const badge = document.getElementById('profQuestionBadge');
  safeSetText(badge, `QUESTION ${index + 1} OF ${total}`);

  // Update question text (safe — no innerHTML)
  const textEl = document.getElementById('profQuestionText');
  safeSetText(textEl, question.text);

  // Show/hide image — validate URL before displaying
  const imgWrapper = document.getElementById('profImageWrapper');
  const imgEl = document.getElementById('profQuestionImage');
  if (question.imageUrl && isValidImageUrl(question.imageUrl)) {
    imgEl.src = question.imageUrl;
    imgWrapper.style.display = 'block';
  } else {
    imgWrapper.style.display = 'none';
    imgEl.src = '';
  }

  // Render answer options (display only for professor)
  renderProfAnswers(question);

  // Toggle Next/End button visibility
  const nextBtn = document.getElementById('nextBtn');
  const endBtn = document.getElementById('endBtn');
  if (index === total - 1) {
    // Last question — show "End Quiz" instead
    if (nextBtn) nextBtn.style.display = 'none';
    if (endBtn) endBtn.style.display = 'block';
  } else {
    if (nextBtn) nextBtn.style.display = 'block';
    if (endBtn) endBtn.style.display = 'none';
  }

  // Start timer
  startProfTimer(QUIZ_DATA.totalTime);

  // Simulate students submitting answers during the timer
  simulateSubmissions();
}

/**
 * Build answer option tiles (professor sees but can't click).
 * Correct answer is visually highlighted for the professor.
 * @param {Object} question
 */
function renderProfAnswers(question) {
  const grid = document.getElementById('profAnswersGrid');
  grid.innerHTML = ''; // safe — no user content here

  question.answers.forEach((answerText, i) => {
    const btn = document.createElement('button');
    btn.className = `answer-btn ${ANSWER_CLASSES[i]}`;
    // Highlight the correct answer for the professor
    if (i === question.correctIndex) {
      btn.classList.add('correct-answer');
    }

    const shape = document.createElement('span');
    shape.className = 'answer-shape';
    safeSetText(shape, ANSWER_SHAPES[i]);

    const text = document.createElement('span');
    text.className = 'answer-text';
    safeSetText(text, sanitizeText(answerText)); // safe

    btn.appendChild(shape);
    btn.appendChild(text);
    grid.appendChild(btn);
  });
}

/**
 * Advance to the next question.
 * Called by the "Next Question" button.
 */
async function nextQuestion() {
  clearInterval(timerInterval);
  if (window.LIVE_SESSION_ID && typeof BuzzMindAPI !== 'undefined') {
    try {
      const session = await BuzzMindAPI.nextQuestion(window.LIVE_SESSION_ID);
      if (session.finished) {
        endQuiz();
        return;
      }
      if (typeof session.currentQuestionIndex === 'number') {
        currentQuestionIndex = session.currentQuestionIndex;
        loadProfQuestion(currentQuestionIndex);
        return;
      }
    } catch (err) {
      console.error('Failed to advance live session:', err);
    }
  }
  currentQuestionIndex++;
  if (currentQuestionIndex < QUIZ_DATA.questions.length) {
    loadProfQuestion(currentQuestionIndex);
  }
}

/**
 * End the quiz — show a simple end state.
 */
// REPLACE WITH THIS:
async function endQuiz() {
  clearInterval(timerInterval);
  if (window.LIVE_SESSION_ID && typeof BuzzMindAPI !== 'undefined') {
    try {
      await BuzzMindAPI.endSession(window.LIVE_SESSION_ID);
    } catch (err) {
      console.error('Failed to end live session:', err);
    }
  }

  // Save final scores to sessionStorage so leaderboard.html can read them
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  sessionStorage.setItem('finalScores', JSON.stringify(sorted));
  sessionStorage.setItem('quizTitle', QUIZ_DATA.title);

  setTimeout(() => {
    window.location.href = "leaderboard2.html";
  }, 800);
}

/**
 * Start the professor's countdown timer.
 * When it hits 0, auto-advance is optional (professor still controls).
 */
function startProfTimer(seconds) {
  timeLeft = seconds;
  updateProfTimerDisplay(timeLeft);

  timerInterval = setInterval(() => {
    timeLeft--;
    updateProfTimerDisplay(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
    }
  }, 1000);
}

/**
 * Update the professor's timer text.
 * @param {number} seconds
 */
function updateProfTimerDisplay(seconds) {
  const el = document.getElementById('profTimer');
  safeSetText(el, `${seconds}s`);
  // Highlight red when urgent
  if (el) {
    el.style.color = seconds <= 5 ? '#ef4444' : 'var(--purple)';
  }
}

/**
 * Update the "answers submitted" stat card and bar.
 */
function updateSubmittedDisplay() {
  const countEl = document.getElementById('submittedCount');
  safeSetText(countEl, `${submittedCount} / ${TOTAL_STUDENTS}`);

  const bar = document.getElementById('submittedBar');
  if (bar) {
    const pct = TOTAL_STUDENTS > 0 ? (submittedCount / TOTAL_STUDENTS) * 100 : 0;
    bar.style.width = `${pct}%`;
  }
}

/**
 * Simulate students submitting answers during the timer.
 * Each simulated student randomly picks an answer;
 * if it's the correct index their score increases.
 */
function simulateSubmissions() {
  const question = QUIZ_DATA.questions[currentQuestionIndex];
  const correctIndex = question.correctIndex;

  scores.forEach((student, i) => {
    // Random delay: each student submits within the question time
    const delay = Math.random() * (QUIZ_DATA.totalTime - 2) * 1000;

    setTimeout(() => {
      // Randomly answer (weighted towards correct to feel realistic)
      const randomAnswer = Math.random() < 0.65 ? correctIndex : Math.floor(Math.random() * 4);

      if (randomAnswer === correctIndex) {
        // Award points (faster answer = more points, simplified here)
        scores[i].score += 1000;
      }

      submittedCount++;
      updateSubmittedDisplay();

      // Update leaderboard each time someone submits
      updateLeaderboard();
    }, delay);
  });
}

/**
 * Sort scores and re-render the leaderboard list.
 * Uses safeSetText throughout — no innerHTML with data.
 */
function updateLeaderboard() {
  // Sort descending by score
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  const list = document.getElementById('leaderboardList');
  if (!list) return;

  list.innerHTML = ''; // safe — we're about to repopulate with controlled data

  // Show top 5
  sorted.slice(0, 5).forEach((student, i) => {
    const item = document.createElement('li');
    item.className = 'leaderboard-item';

    // Rank
    const rank = document.createElement('span');
    rank.className = `lb-rank rank-${i + 1}`;
    safeSetText(rank, `#${i + 1}`);

    // Name (sanitized before display)
    const name = document.createElement('span');
    name.className = 'lb-name';
    safeSetText(name, sanitizeText(student.name));

    // Score
    const scoreEl = document.createElement('span');
    scoreEl.className = 'lb-score';
    safeSetText(scoreEl, student.score.toLocaleString());

    item.appendChild(rank);
    item.appendChild(name);
    item.appendChild(scoreEl);
    list.appendChild(item);
  });
}

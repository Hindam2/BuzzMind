/* =============================================
   student-quiz.js
   Handles the student-facing quiz experience:
   - Shows one question at a time with a timer
   - Lets student pick one answer
   - Shows correct/incorrect feedback
   - Tracks score and shows results at the end
   ============================================= */

// ---- State ----
let currentQuestionIndex = 0; // which question we're on
let score = 0; // how many correct answers
let timerInterval = null; // reference to the countdown interval
let timeLeft = 0; // seconds remaining for current question
let answered = false; // has the student answered yet?

// Total time per question (from quiz-data.js)
const QUESTION_TIME = QUIZ_DATA.totalTime;
// Circumference of the SVG timer ring (2 * π * r, r=26)
const RING_CIRCUMFERENCE = 163.4;

// ---- Start on page load ----
document.addEventListener('DOMContentLoaded', async () => {
  if (window.quizReady) await window.quizReady;
  if (window.LIVE_SESSION_ID && typeof BuzzMindAPI !== 'undefined') {
    try {
      const session = await BuzzMindAPI.getSession(window.LIVE_SESSION_ID);
      if (session?.pin) sessionStorage.setItem('gamePin', session.pin);

      if (session?.status !== 'active') {
        const pin = session?.pin || sessionStorage.getItem('gamePin') || '';
        const lobbyUrl = pin
          ? `/Student pages/Joined Students/Joined Students.html?pin=${encodeURIComponent(pin)}`
          : '/Student pages/Joined Students/Joined Students.html';
        window.location.href = lobbyUrl;
        return;
      }

      if (typeof session.currentQuestionIndex === 'number') {
        currentQuestionIndex = session.currentQuestionIndex;
      }
    } catch (err) {
      console.error('Failed to verify session state:', err);
    }
  }
  loadQuestion(currentQuestionIndex);
});

/**
 * Load and display a question by index.
 * @param {number} index
 */
function loadQuestion(index) {
  // Reset answered flag
  answered = false;

  const question = QUIZ_DATA.questions[index];
  const totalQuestions = QUIZ_DATA.questions.length;

  // Update question badge: "QUESTION 2 OF 4"
  const badge = document.getElementById('questionBadge');
  safeSetText(badge, `QUESTION ${index + 1} OF ${totalQuestions}`);

  // Update question text (safe — no innerHTML)
  const questionTextEl = document.getElementById('questionText');
  safeSetText(questionTextEl, question.text);

  // Show/hide image — validate URL before displaying
  const imageWrapper = document.getElementById('questionImageWrapper');
  const imgEl = document.getElementById('questionImage');
  if (question.imageUrl && isValidImageUrl(question.imageUrl)) {
    imgEl.src = question.imageUrl; // URL already validated
    imageWrapper.style.display = 'block';
  } else {
    imageWrapper.style.display = 'none';
    imgEl.src = '';
  }

  // Render the 4 answer buttons
  renderAnswers(question);

  // Hide old feedback
  const feedback = document.getElementById('feedbackBanner');
  if (feedback) feedback.style.display = 'none';

  // Start countdown timer
  startTimer(QUESTION_TIME);
}

/**
 * Build the 4 answer choice buttons.
 * Uses safeSetText everywhere — no innerHTML.
 * @param {Object} question
 */
function renderAnswers(question) {
  const grid = document.getElementById('answersGrid');
  grid.innerHTML = ''; // clear old buttons (this is safe — no user content)

  question.answers.forEach((answerText, i) => {
    const btn = document.createElement('button');
    btn.className = `answer-btn ${ANSWER_CLASSES[i]}`;
    btn.setAttribute('data-index', i); // store answer index

    // Shape icon
    const shape = document.createElement('span');
    shape.className = 'answer-shape';
    safeSetText(shape, ANSWER_SHAPES[i]); // safe

    // Answer text — use safeSetText, NOT innerHTML
    const text = document.createElement('span');
    text.className = 'answer-text';
    safeSetText(text, sanitizeText(answerText)); // sanitized + safe

    btn.appendChild(shape);
    btn.appendChild(text);

    // Click handler
    btn.addEventListener('click', () => handleAnswer(i));

    grid.appendChild(btn);
  });
}

/**
 * Handle the student selecting an answer.
 * @param {number} selectedIndex - which answer they clicked (0-3)
 */
async function handleAnswer(selectedIndex) {
  if (answered) return;
  answered = true;

  clearInterval(timerInterval);

  const question = QUIZ_DATA.questions[currentQuestionIndex];
  let isCorrect = selectedIndex === question.correctIndex;

  if (window.LIVE_SESSION_ID && typeof BuzzMindAPI !== 'undefined') {
    try {
      const result = await BuzzMindAPI.submitAnswer(window.LIVE_SESSION_ID, {
        playerId: sessionStorage.getItem('playerId'),
        displayName: sessionStorage.getItem('playerName'),
        answerIndex: selectedIndex,
      });
      isCorrect = result.correct;
      question.correctIndex = result.correctIndex;
      if (result.correct) score++;
    } catch (err) {
      console.error(err);
      if (isCorrect) score++;
    }
  } else if (isCorrect) {
    score++;
  }

  // Visually mark correct and wrong answers
  revealAnswers(question.correctIndex, selectedIndex);

  // Show feedback banner
  showFeedback(isCorrect);

  // Move to next question after 2 seconds
  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < QUIZ_DATA.questions.length) {
      loadQuestion(currentQuestionIndex);
    } else {
      showResults();
    }
  }, 2000);
}

/**
 * Highlight the correct answer and dim wrong ones.
 * @param {number} correctIndex
 * @param {number} selectedIndex
 */
function revealAnswers(correctIndex, selectedIndex) {
  const buttons = document.querySelectorAll('.answer-btn');
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === correctIndex) {
      btn.classList.add('correct-answer');
    } else {
      btn.classList.add('wrong-answer');
    }
  });
}

/**
 * Show the correct/incorrect feedback banner.
 * @param {boolean} isCorrect
 */
function showFeedback(isCorrect) {
  const banner = document.getElementById('feedbackBanner');
  const icon = document.getElementById('feedbackIcon');
  const text = document.getElementById('feedbackText');

  banner.className = `feedback-banner ${isCorrect ? 'correct' : 'incorrect'}`;
  safeSetText(icon, '');
  safeSetText(
    text,
    isCorrect ? 'Correct! Great job!' : 'Not quite — keep going!',
  );
  banner.style.display = 'flex';
}

/**
 * Start the countdown timer for a question.
 * Updates both the number and the SVG ring.
 * @param {number} seconds
 */
function startTimer(seconds) {
  timeLeft = seconds;
  updateTimerDisplay(timeLeft);

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      // Time's up — treat as wrong answer if not answered
      if (!answered) {
        answered = true;
        revealAnswers(
          QUIZ_DATA.questions[currentQuestionIndex].correctIndex,
          -1,
        );
        showFeedback(false);
        setTimeout(() => {
          currentQuestionIndex++;
          if (currentQuestionIndex < QUIZ_DATA.questions.length) {
            loadQuestion(currentQuestionIndex);
          } else {
            showResults();
          }
        }, 2000);
      }
    }
  }, 1000);
}

/**
 * Update the timer number and SVG ring animation.
 * @param {number} seconds
 */
function updateTimerDisplay(seconds) {
  const numEl = document.getElementById('timerNumber');
  const ring = document.getElementById('timerRing');

  safeSetText(numEl, seconds);

  // Calculate how much of the ring to show
  // When full time: offset = 0. When time = 0: offset = full circumference.
  const progress = seconds / QUESTION_TIME;
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  if (ring) {
    ring.style.strokeDashoffset = offset;
    // Turn ring red when under 5 seconds
    if (seconds <= 5) {
      ring.classList.add('urgent');
    } else {
      ring.classList.remove('urgent');
    }
  }
}

/**
 * Hide the quiz area and show the final results screen.
 */
// REPLACE WITH THIS:
function leaderboardUrl() {
  const sessionId =
    window.LIVE_SESSION_ID || sessionStorage.getItem('gameSessionId');
  return sessionId
    ? `/Quiz/leaderboard.html?session=${encodeURIComponent(sessionId)}`
    : '/Quiz/leaderboard.html';
}

function showResults() {
  const total = QUIZ_DATA.questions.length;
  const resultsScreen = document.getElementById('resultsScreen');
  const quizArea = document.getElementById('quizArea');

  sessionStorage.setItem('finalScore', score);
  sessionStorage.setItem('totalQuestions', total);
  sessionStorage.setItem(
    'playerName',
    sessionStorage.getItem('playerName') || 'Student',
  );

  if (quizArea) quizArea.style.display = 'none';
  if (resultsScreen) {
    resultsScreen.style.display = 'flex';
    const resultsScore = document.getElementById('resultsScore');
    if (resultsScore) {
      safeSetText(resultsScore, `You got ${score} / ${total} correct!`);
    }
  }

  const resultsBtn = document.getElementById('resultsLeaderboardBtn');
  if (resultsBtn) {
    resultsBtn.onclick = () => {
      window.location.href = leaderboardUrl();
    };
  }

  setTimeout(() => {
    window.location.href = leaderboardUrl();
  }, 800);
}

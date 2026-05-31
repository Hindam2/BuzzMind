//  **Shared BuzzMind API client — include on pages that call the backend**
const BuzzMindAPI = {
  async request(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  },

  getMe() {
    return this.request('/api/auth/me');
  },

  logout() {
    return this.request('/api/auth/logout', { method: 'POST' });
  },

  getProfile() {
    return this.request('/api/users/profile');
  },

  updateProfile(body) {
    return this.request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  updatePassword(body) {
    return this.request('/api/users/password', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  getClasses() {
    return this.request('/api/classes');
  },

  createClass(body) {
    return this.request('/api/classes', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getClass(id) {
    return this.request(`/api/classes/${id}`);
  },

  addStudent(classId, body) {
    return this.request(`/api/classes/${classId}/students`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  deleteClass(classId) {
    return this.request(`/api/classes/${classId}`, { method: 'DELETE' });
  },

  deleteStudent(classId, studentId) {
    return this.request(`/api/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    });
  },

  createQuiz(body) {
    return this.request('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  launchQuiz(quizId) {
    return this.request(`/api/quizzes/${quizId}/launch`, { method: 'POST' });
  },

  joinSession(pin, displayName) {
    const body = { pin };
    if (displayName) body.displayName = displayName;
    return this.request('/api/sessions/join', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getSessionByPin(pin) {
    return this.request(`/api/sessions/pin/${pin}`);
  },

  getSession(id) {
    return this.request(`/api/sessions/${id}`);
  },

  getSessionQuiz(id) {
    return this.request(`/api/sessions/${id}/quiz`);
  },

  startSession(id) {
    return this.request(`/api/sessions/${id}/start`, { method: 'POST' });
  },

  nextQuestion(id) {
    return this.request(`/api/sessions/${id}/next`, { method: 'POST' });
  },

  endSession(id) {
    return this.request(`/api/sessions/${id}/end`, { method: 'POST' });
  },

  submitAnswer(sessionId, body) {
    return this.request(`/api/sessions/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getLeaderboard(sessionId) {
    return this.request(`/api/sessions/${sessionId}/leaderboard`);
  },

  getProfessors() {
    return this.request('/api/admin/professors');
  },

  createProfessor(body) {
    return this.request('/api/admin/professors', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  deleteProfessor(id) {
    return this.request(`/api/admin/professors/${id}`, { method: 'DELETE' });
  },

  getReports() {
    return this.request('/api/reports');
  },

  getLibrary() {
    return this.request('/api/quizzes/library');
  },
};

if (typeof window !== 'undefined') window.BuzzMindAPI = BuzzMindAPI;

(function () {
  function setAlert(el, msg, type) {
    if (!el) return;
    el.textContent = msg || '';
    el.className = msg ? `form-alert show ${type === 'success' ? 'success' : 'error'}` : 'form-alert';
    if (msg) {
      clearTimeout(el._t);
      el._t = setTimeout(() => {
        el.className = 'form-alert';
        el.textContent = '';
      }, 4000);
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isStrongPassword(pw) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pw);
  }

  function fillHeader(name, role) {
    const nm = document.getElementById('profileName');
    const rl = document.getElementById('profileRole');
    const av = document.getElementById('profileAvatar');
    if (nm) nm.textContent = name || 'Your Name';
    if (rl && role) rl.textContent = role;
    if (av) av.textContent = (window.Dash ? Dash.initials(name || 'U') : (name || 'U').charAt(0)).toUpperCase();
  }

  async function saveAccount() {
    const name = document.getElementById('displayName').value.trim();
    const email = document.getElementById('emailAddress').value.trim();
    const username = document.getElementById('username').value.trim();
    const msg = document.getElementById('accountMsg');

    if (!name) return setAlert(msg, 'Display name cannot be empty.', 'error');
    if (!username) return setAlert(msg, 'Username cannot be empty.', 'error');
    if (!isValidEmail(email)) return setAlert(msg, 'Please enter a valid email address.', 'error');

    const btn = document.getElementById('saveAccountBtn');
    btn.disabled = true;
    try {
      await BuzzMindAPI.updateProfile({ name, email, username });
      fillHeader(name);
      setAlert(msg, 'Changes saved successfully!', 'success');
    } catch (err) {
      setAlert(msg, err.message || 'Could not save changes.', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  async function updatePassword() {
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    const msg = document.getElementById('passwordMsg');

    if (!current) return setAlert(msg, 'Please enter your current password.', 'error');
    if (!isStrongPassword(newPass)) {
      return setAlert(
        msg,
        'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
        'error',
      );
    }
    if (newPass !== confirmPass) return setAlert(msg, 'Passwords do not match.', 'error');

    const btn = document.getElementById('updatePasswordBtn');
    btn.disabled = true;
    try {
      await BuzzMindAPI.updatePassword({ currentPassword: current, newPassword: newPass });
      setAlert(msg, 'Password updated successfully!', 'success');
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
    } catch (err) {
      setAlert(msg, err.message || 'Could not update password.', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  document.getElementById('saveAccountBtn').addEventListener('click', saveAccount);
  document.getElementById('updatePasswordBtn').addEventListener('click', updatePassword);

  const boot = Dash.boot('settings');
  (async () => {
    let role = '';
    try {
      const me = await boot;
      if (me) role = me.role || '';
    } catch (_) {
      /* not logged in */
    }
    try {
      const profile = await BuzzMindAPI.getProfile();
      document.getElementById('displayName').value = profile.name || '';
      document.getElementById('emailAddress').value = profile.email || '';
      document.getElementById('username').value = profile.username || '';
      fillHeader(profile.name, role);
    } catch (_) {
      fillHeader('Your Name', role);
    }
  })();
})();

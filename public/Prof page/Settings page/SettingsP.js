// ---------- Helper Functions ----------
function showMsg(element, text, color) {
  element.textContent = text;
  element.style.color = color === 'red' ? '#dc2626' : '#15803d';

  setTimeout(() => {
    element.textContent = '';
  }, 3000);
}

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function isStrongPassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
}

// ---------- Generate Random 8-digit ID ----------
function generateRandomId() {
  const randomId = Math.floor(10000000 + Math.random() * 90000000);
  return randomId.toString();
}

// ---------- Update Profile Name in the Card ----------
function updateProfileDisplayName(name) {
  const profileNameElement = document.querySelector('.profile-info h2');
  if (profileNameElement && name) {
    profileNameElement.textContent = name;
  } else if (profileNameElement) {
    profileNameElement.textContent = 'Your Name';
  }
}

// ---------- Save Account Changes ----------
async function saveAccount() {
  const name = document.getElementById('displayName').value.trim();
  const email = document.getElementById('emailAddress').value.trim();
  const username = document.getElementById('username').value.trim();
  const msg = document.getElementById('accountMsg');

  if (!name) {
    showMsg(msg, 'Display name cannot be empty.', 'red');
    return;
  }

  if (!username) {
    showMsg(msg, 'Username cannot be empty.', 'red');
    return;
  }

  if (!isValidEmail(email)) {
    showMsg(msg, 'Please enter a valid email address.', 'red');
    return;
  }

  if (typeof BuzzMindAPI !== 'undefined') {
    try {
      await BuzzMindAPI.updateProfile({ name, email, username });
    } catch (err) {
      showMsg(msg, err.message, 'red');
      return;
    }
  }

  updateProfileDisplayName(name);
  showMsg(msg, 'Changes saved successfully!', 'green');
}

// ---------- Update Password ----------
async function updatePassword() {
  const current = document.getElementById('currentPassword').value;
  const newPass = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmPassword').value;
  const msg = document.getElementById('passwordMsg');

  if (!current) {
    showMsg(msg, 'Please enter your current password.', 'red');
    return;
  }

  if (!isStrongPassword(newPass)) {
    showMsg(
      msg,
      'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
      'red',
    );
    return;
  }

  if (newPass !== confirm) {
    showMsg(msg, 'Passwords do not match.', 'red');
    return;
  }

  if (typeof BuzzMindAPI !== 'undefined') {
    try {
      await BuzzMindAPI.updatePassword({
        currentPassword: current,
        newPassword: newPass,
      });
    } catch (err) {
      showMsg(msg, err.message, 'red');
      return;
    }
  }

  showMsg(msg, 'Password updated successfully!', 'green');

  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
}

// ---------- Logout ----------
function logout() {
  const confirmed = confirm('Are you sure you want to log out?');
  if (confirmed) {
    window.location.href = '/logout';
  }
}

// ---------- Initialize Page on Load ----------
window.addEventListener('DOMContentLoaded', async () => {
  const userIdField = document.getElementById('username');
  if (typeof BuzzMindAPI !== 'undefined') {
    try {
      const profile = await BuzzMindAPI.getProfile();
      document.getElementById('displayName').value = profile.name || '';
      document.getElementById('emailAddress').value = profile.email || '';
      if (userIdField) userIdField.value = profile.username || '';
      updateProfileDisplayName(profile.name);
      return;
    } catch (_) {
      /* fallback */
    }
  }
  if (userIdField) userIdField.value = generateRandomId();
  updateProfileDisplayName('Your Name');
});

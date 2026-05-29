document.addEventListener('DOMContentLoaded', function () {
  const signupBtn = document.getElementById('signup-btn');
  const loginBtn = document.getElementById('login-btn');
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  function showSignup() {
    signupBtn.classList.add('active');
    loginBtn.classList.remove('active');
    signupForm.style.display = '';
    loginForm.style.display = 'none';
  }

  function showLogin() {
    signupBtn.classList.remove('active');
    loginBtn.classList.add('active');
    signupForm.style.display = 'none';
    loginForm.style.display = '';
  }

  if (signupBtn && loginBtn) {
    signupBtn.addEventListener('click', showSignup);
    loginBtn.addEventListener('click', showLogin);
  }

  // If the URL contains an error or role query, auto-select the appropriate tab
  try {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const role = params.get('role');
    if (role) {
      showSignup();
    } else if (error) {
      // Show login tab for authentication errors, signup for registration errors
      const loginErrors = [
        'user_not_found',
        'wrong_password',
        'invalid_credentials',
      ];
      if (loginErrors.includes(error)) showLogin();
      else showSignup();
    }
  } catch (e) {
    // ignore URL parsing errors
  }
});

function validateSignup() {
  let ok = true;
  const name = document.getElementById('fullname').value || '';
  if (name.length < 3) {
    document.getElementById('nvir').innerHTML = 'Name must be at least 3 chars';
    ok = false;
  } else {
    document.getElementById('nvir').innerHTML = '';
  }

  const username = document.getElementById('username').value || '';
  if (username.length < 3) {
    document.getElementById('unvir').innerHTML =
      'Username must be at least 3 chars';
    ok = false;
  } else {
    document.getElementById('unvir').innerHTML = '';
  }

  const email = document.getElementById('email').value || '';
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    document.getElementById('evir').innerHTML = 'Please enter a valid email';
    ok = false;
  } else {
    document.getElementById('evir').innerHTML = '';
  }

  const pass = document.getElementById('password').value || '';
  const passRe = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;
  if (!passRe.test(pass)) {
    document.getElementById('pvir').innerHTML =
      'At least 8 chars, one uppercase, one number';
    ok = false;
  } else {
    document.getElementById('pvir').innerHTML = '';
  }

  return ok;
}

function validateLogin() {
  let ok = true;
  const id = document.getElementById('emailOrUsername').value || '';
  const pw = document.getElementById('login-password').value || '';
  if (!id.trim()) {
    document.getElementById('login-vir').innerHTML = 'Enter email or username';
    ok = false;
  } else {
    document.getElementById('login-vir').innerHTML = '';
  }
  if (!pw.trim()) {
    document.getElementById('login-pvir').innerHTML = 'Enter password';
    ok = false;
  } else {
    document.getElementById('login-pvir').innerHTML = '';
  }
  return ok;
}

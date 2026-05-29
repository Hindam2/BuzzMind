function hideErrorMessage() {
  const errorMessage = document.getElementById('error-msg');
  if (errorMessage) {
    errorMessage.style.display = 'none';
  }
}

// Toggle between signup and login forms
document.getElementById('signup-btn').addEventListener('click', function () {
  document.getElementById('signup-btn').classList.add('active');
  document.getElementById('login-btn').classList.remove('active');
  document.getElementById('signup-form').style.display = 'block';
  document.getElementById('login-form').style.display = 'none';
  hideErrorMessage();
});

document.getElementById('login-btn').addEventListener('click', function () {
  document.getElementById('login-btn').classList.add('active');
  document.getElementById('signup-btn').classList.remove('active');
  document.getElementById('signup-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
  hideErrorMessage();
});

function validateSignup() {
  var x = true;

  let n = document.getElementById('fullname').value;
  let n1 = /.{3,}/;
  if (!n1.test(n)) {
    document.getElementById('nvir').innerHTML = 'Name must be at least 3 chars';
    x = false;
  } else {
    document.getElementById('nvir').innerHTML = '';
  }

  let un = document.getElementById('username').value;
  let un1 = /.{3,}/;
  if (!un1.test(un)) {
    document.getElementById('unvir').innerHTML =
      'Username must be at least 3 chars';
    x = false;
  } else {
    document.getElementById('unvir').innerHTML = '';
  }

  let y = document.getElementById('email').value;
  let y1 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!y1.test(y)) {
    document.getElementById('evir').innerHTML = 'Please enter a valid email';
    x = false;
  } else {
    document.getElementById('evir').innerHTML = '';
  }

  let v = document.getElementById('password').value;
  let vl = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;
  if (!vl.test(v)) {
    document.getElementById('pvir').innerHTML =
      'At least 8 chars, one uppercase, one number';
    x = false;
  } else {
    document.getElementById('pvir').innerHTML = '';
  }

  return x;
}

function validateLogin() {
  var x = true;

  let emailOrUsername = document.getElementById('emailOrUsername').value;
  if (!emailOrUsername) {
    document.getElementById('login-vir').innerHTML =
      'Please enter email or username';
    x = false;
  } else {
    document.getElementById('login-vir').innerHTML = '';
  }

  let password = document.getElementById('login-password').value;
  if (!password) {
    document.getElementById('login-pvir').innerHTML = 'Please enter password';
    x = false;
  } else {
    document.getElementById('login-pvir').innerHTML = '';
  }

  return x;
}

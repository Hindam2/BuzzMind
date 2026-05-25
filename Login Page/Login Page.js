function validateemail() {
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
    document.getElementById('evir').innerHTML = 'Please fill the email field';
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

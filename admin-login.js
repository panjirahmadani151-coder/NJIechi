document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('admin-login-form');
  const errorDisplay = document.getElementById('admin-login-error');
  const authKey = 'njiAdminAuth';

  if (localStorage.getItem(authKey) === '1') {
    window.location.href = 'admin.html';
    return;
  }

  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = form.username.value.trim();
    const password = form.password.value;

    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem(authKey, '1');
      window.location.href = 'admin.html';
      return;
    }

    errorDisplay.textContent = 'Username atau password salah. Coba lagi.';
  });
});

(function(){
  const authKey = 'njiAdminAuth';
  const isAdmin = localStorage.getItem(authKey) === '1';
  if (!isAdmin) {
    window.location.href = 'admin-login.html';
    return;
  }

  const logoutBtn = document.getElementById('admin-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(authKey);
      window.location.href = 'admin-login.html';
    });
  }
})();

function loginAdmin(event) {
  event.preventDefault();
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;

  // Identifiants admin
  const adminEmail = 'tafitaperl@gmail.com';
  const adminPassword = '123456';

  if (email === adminEmail && password === adminPassword) {
    // Sauvegarder la session admin
    localStorage.setItem('cocoHairUser', JSON.stringify({
      email: email,
      loginTime: new Date().getTime(),
      role: 'admin'
    }));

    window.location.href = 'admin.html';
  } else {
    alert('Email ou mot de passe incorrect');
    document.getElementById('adminEmail').value = '';
    document.getElementById('adminPassword').value = '';
  }
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById('adminPassword');
  const toggleButton = document.querySelector('.toggle-password');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleButton.classList.add('visible');
  } else {
    passwordInput.type = 'password';
    toggleButton.classList.remove('visible');
  }
}

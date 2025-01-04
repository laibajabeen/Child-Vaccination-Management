const {
  setupPanelSwitch,
  validateName,
  validateEmail,
  validatePassword,
  setupLoginHandler,
  setupSignupHandler,
  initializeApp,
} = require('./index');

describe('Validation Functions', () => {
  test('validateName should return true for valid names', () => {
    expect(validateName('John')).toBe(true);
    expect(validateName('Jane Doe')).toBe(true);
  });

  test('validateName should return false for invalid names', () => {
    expect(validateName('J')).toBe(false);
    expect(validateName('John123')).toBe(false);
    expect(validateName('')).toBe(false);
  });

  test('validateEmail should return true for valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co')).toBe(true);
  });

  test('validateEmail should return false for invalid emails', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('user@.com')).toBe(false);
    expect(validateEmail('user@domain.')).toBe(false);
  });

  test('validatePassword should return true for valid passwords', () => {
    expect(validatePassword('Password1!')).toBe(true);
    expect(validatePassword('Strong@123')).toBe(true);
  });

  test('validatePassword should return false for invalid passwords', () => {
    expect(validatePassword('password')).toBe(false);
    expect(validatePassword('Password')).toBe(false);
    expect(validatePassword('Pass123')).toBe(false);
  });
});

describe('Panel Switch', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="signUp"></button>
      <button id="signIn"></button>
      <div class="container"></div>
    `;
  });

  test('setupPanelSwitch should toggle right-panel-active class on container', () => {
    setupPanelSwitch();
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.querySelector('.container');

    signUpButton.click();
    expect(container.classList.contains('right-panel-active')).toBe(true);

    signInButton.click();
    expect(container.classList.contains('right-panel-active')).toBe(false);
  });
});

describe('Form Handlers', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="loginForm">
        <input id="loginEmail" type="text" />
        <input id="loginPassword" type="password" />
        <div id="loginMessage"></div>
      </form>
      <form id="signupForm">
        <input id="signupName" type="text" />
        <input id="signupEmail" type="text" />
        <input id="signupPassword" type="password" />
        <div id="signupMessage"></div>
      </form>
    `;
  });

  test('setupLoginHandler should display an error message for invalid email', () => {
    setupLoginHandler();
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    document.getElementById('loginEmail').value = 'invalid-email';
    document.getElementById('loginPassword').value = 'password123!';

    loginForm.dispatchEvent(new Event('submit'));
    expect(loginMessage.textContent).toBe('Please enter a valid email address.');
    expect(loginMessage.className).toBe('message error-message');
  });

  test('setupSignupHandler should display an error message for invalid name', () => {
    setupSignupHandler();
    const signupForm = document.getElementById('signupForm');
    const signupMessage = document.getElementById('signupMessage');
    document.getElementById('signupName').value = 'J';
    document.getElementById('signupEmail').value = 'test@example.com';
    document.getElementById('signupPassword').value = 'Password1!';

    signupForm.dispatchEvent(new Event('submit'));
    expect(signupMessage.textContent).toBe('Name should be at least 2 characters long and contain only letters and spaces.');
    expect(signupMessage.className).toBe('message error-message');
  });
});

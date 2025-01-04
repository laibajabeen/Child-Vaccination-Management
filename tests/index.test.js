// index.test.js
import '@testing-library/jest-dom';
import { fireEvent } from '@testing-library/dom';

describe('Form Validation Functions', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="container">
        <div class="form-container sign-up-container">
          <form id="signupForm">
            <input type="text" id="signupName" />
            <input type="email" id="signupEmail" />
            <input type="password" id="signupPassword" />
            <div id="signupMessage" class="message"></div>
          </form>
        </div>
        <div class="form-container sign-in-container">
          <form id="loginForm">
            <input type="email" id="loginEmail" />
            <input type="password" id="loginPassword" />
            <div id="loginMessage" class="message"></div>
          </form>
        </div>
      </div>
      <button id="signUp">Sign Up</button>
      <button id="signIn">Sign In</button>
    `;

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' }),
      })
    );

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Mock location.href
    delete window.location;
    window.location = { href: '' };
  });

  describe('Name Validation', () => {
    test('validates correct names', () => {
      expect(validateName('John')).toBe(true);
      expect(validateName('John Doe')).toBe(true);
      expect(validateName('Mary Jane Wilson')).toBe(true);
    });

    test('rejects invalid names', () => {
      expect(validateName('J')).toBe(false);
      expect(validateName('John123')).toBe(false);
      expect(validateName('John@Doe')).toBe(false);
      expect(validateName('')).toBe(false);
    });
  });

  describe('Email Validation', () => {
    test('validates correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user-name@domain.com')).toBe(true);
    });

    test('rejects invalid email addresses', () => {
      expect(validateEmail('test@.com')).toBe(false);
      expect(validateEmail('test@com')).toBe(false);
      expect(validateEmail('test.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    test('validates correct passwords', () => {
      expect(validatePassword('Password123!')).toBe(true);
      expect(validatePassword('Complex1@Pass')).toBe(true);
      expect(validatePassword('Test1ng@Home')).toBe(true);
    });

    test('rejects invalid passwords', () => {
      expect(validatePassword('password')).toBe(false);
      expect(validatePassword('Password')).toBe(false);
      expect(validatePassword('Password1')).toBe(false);
      expect(validatePassword('Pass1!')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('Panel Switch Animation', () => {
    test('adds right-panel-active class on signup button click', () => {
      const container = document.querySelector('.container');
      const signUpButton = document.getElementById('signUp');
      
      fireEvent.click(signUpButton);
      expect(container.classList.contains('right-panel-active')).toBe(true);
    });

    test('removes right-panel-active class on signin button click', () => {
      const container = document.querySelector('.container');
      const signInButton = document.getElementById('signIn');
      
      container.classList.add('right-panel-active');
      fireEvent.click(signInButton);
      expect(container.classList.contains('right-panel-active')).toBe(false);
    });
  });

  describe('Login Form', () => {
    test('shows error message for invalid email', async () => {
      const loginForm = document.getElementById('loginForm');
      const emailInput = document.getElementById('loginEmail');
      const messageDiv = document.getElementById('loginMessage');

      emailInput.value = 'invalid-email';
      await fireEvent.submit(loginForm);

      expect(messageDiv.textContent).toBe('Please enter a valid email address.');
      expect(messageDiv.className).toContain('error-message');
    });

    test('shows error message for empty password', async () => {
      const loginForm = document.getElementById('loginForm');
      const emailInput = document.getElementById('loginEmail');
      const passwordInput = document.getElementById('loginPassword');
      const messageDiv = document.getElementById('loginMessage');

      emailInput.value = 'test@example.com';
      passwordInput.value = '';
      await fireEvent.submit(loginForm);

      expect(messageDiv.textContent).toBe('Password cannot be empty.');
      expect(messageDiv.className).toContain('error-message');
    });

    test('handles successful login', async () => {
      const loginForm = document.getElementById('loginForm');
      const emailInput = document.getElementById('loginEmail');
      const passwordInput = document.getElementById('loginPassword');
      const messageDiv = document.getElementById('loginMessage');

      emailInput.value = 'test@example.com';
      passwordInput.value = 'Password123!';
      await fireEvent.submit(loginForm);

      expect(messageDiv.textContent).toBe('Login successful!');
      expect(messageDiv.className).toContain('success-message');
      expect(localStorage.setItem).toHaveBeenCalledWith('userEmail', 'test@example.com');
    });
  });

  describe('Signup Form', () => {
    test('shows error message for invalid name', async () => {
      const signupForm = document.getElementById('signupForm');
      const nameInput = document.getElementById('signupName');
      const messageDiv = document.getElementById('signupMessage');

      nameInput.value = 'J';
      await fireEvent.submit(signupForm);

      expect(messageDiv.textContent).toBe('Name should be at least 2 characters long and contain only letters and spaces.');
      expect(messageDiv.className).toContain('error-message');
    });

    test('shows error message for invalid password', async () => {
      const signupForm = document.getElementById('signupForm');
      const nameInput = document.getElementById('signupName');
      const emailInput = document.getElementById('signupEmail');
      const passwordInput = document.getElementById('signupPassword');
      const messageDiv = document.getElementById('signupMessage');

      nameInput.value = 'John Doe';
      emailInput.value = 'test@example.com';
      passwordInput.value = 'weak';
      await fireEvent.submit(signupForm);

      expect(messageDiv.textContent).toBe('Password must be at least 8 characters long and include: uppercase letter, lowercase letter, number, and special character.');
      expect(messageDiv.className).toContain('error-message');
    });

    test('handles successful signup', async () => {
      const signupForm = document.getElementById('signupForm');
      const nameInput = document.getElementById('signupName');
      const emailInput = document.getElementById('signupEmail');
      const passwordInput = document.getElementById('signupPassword');
      const messageDiv = document.getElementById('signupMessage');

      nameInput.value = 'John Doe';
      emailInput.value = 'test@example.com';
      passwordInput.value = 'Password123!';
      await fireEvent.submit(signupForm);

      expect(messageDiv.textContent).toBe('Signup successful!');
      expect(messageDiv.className).toContain('success-message');
      expect(localStorage.setItem).toHaveBeenCalledWith('userEmail', 'test@example.com');
    });
  });
});
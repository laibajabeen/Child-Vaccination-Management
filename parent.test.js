describe('Child Registration Form', () => {
    // Mock alert before tests
    beforeAll(() => {
      global.alert = jest.fn();
    });
  
    // Clear mocks after each test
    afterEach(() => {
      global.alert.mockClear();
    });
  
    let originalAddEventListener;
  
    beforeEach(() => {
      // Save the original addEventListener
      originalAddEventListener = document.getElementById;
  
      // Mock document.getElementById 
      document.getElementById = jest.fn().mockImplementation((id) => {
        switch(id) {
          case 'childRegistrationForm':
            return {
              addEventListener: jest.fn((event, callback) => {
                const mockEvent = { 
                  preventDefault: jest.fn(),
                  target: {
                    querySelector: jest.fn().mockReturnValue({ value: '' })
                  }
                };
                callback(mockEvent);
              })
            };
          case 'parentEmail':
            return { value: 'test@example.com' };
          case 'childName':
            return { value: 'John Doe' };
          case 'childDOB':
            return { value: '2020-01-01' };
          case 'gender':
            return { value: 'Male' };
          default:
            return null;
        }
      });
  
      // Mock querySelectorAll for vaccine selection
      document.querySelectorAll = jest.fn().mockReturnValue([
        { value: 'vaccine1', checked: true }
      ]);
    });
  
    afterEach(() => {
      // Restore original implementation
      document.getElementById = originalAddEventListener;
    });
  
    test('Child Registration Form Submission', () => {
      // Require the script to trigger its event listeners
      require('./parent');
  
      // Add expectations based on your specific implementation
      expect(document.getElementById).toHaveBeenCalledWith('childRegistrationForm');
    });
  });
import '@testing-library/jest-dom';

// Mock global fetch
global.fetch = jest.fn();

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-key';

// Mock MediaRecorder for browser tests
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'MediaRecorder', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      addEventListener: jest.fn(),
      state: 'inactive',
    })),
  });
}

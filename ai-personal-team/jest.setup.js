import '@testing-library/jest-dom'

// Mock global fetch if not available
global.fetch = global.fetch || require('jest-fetch-mock')

// Silence console errors during tests unless debugging
if (process.env.NODE_ENV === 'test') {
  const originalError = console.error
  beforeAll(() => {
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
        return
      }
      originalError.call(console, ...args)
    }
  })

  afterAll(() => {
    console.error = originalError
  })
}

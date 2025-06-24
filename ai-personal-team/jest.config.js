module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'agents/**/*.ts',
    'app/**/*.tsx',
    'pages/api/**/*.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './tests/reports',
        filename: 'test-report.html',
        expand: true,
        openReport: true
      }
    ]
  ]
};

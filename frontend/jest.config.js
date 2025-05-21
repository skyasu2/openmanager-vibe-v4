module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '^../services/(.*)$': '<rootDir>/services/$1',
    '^../components/(.*)$': '<rootDir>/components/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
}; 
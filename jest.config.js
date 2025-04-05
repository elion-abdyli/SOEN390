// jest.config.js
module.exports = {
    preset: 'jest-expo',
    testEnvironment: 'node',
    collectCoverage: true,
    collectCoverageFrom: [
      'components/InputComponents/**/*.{js,jsx,ts,tsx}',
      'components/MapComponents/**/*.{js,jsx,ts,tsx}',
      'screens/**/*.{js,jsx,ts,tsx}',
      'services/**/*.{js,jsx,ts,tsx}',
      'navigation/**/*.{js,jsx,ts,tsx}',
      'hooks/**/*.{js,jsx,ts,tsx}',
      '!**/node_modules/**',
      '!**/setupTests.js',
      '!**/coverage/**',
    ],
    coveragePathIgnorePatterns: ['/node_modules/'],
    moduleNameMapper: {
      '^@/constants/GoogleKey$': '<rootDir>/__mocks__/constants/GoogleKey.js',
      '^@/(.*)$': '<rootDir>/$1',
    },
    setupFiles: ['<rootDir>/navigation/setupTests.js'],
  };

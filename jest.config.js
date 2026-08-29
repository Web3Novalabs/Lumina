module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/nevo_server/src'],
  testRegex: '.*\\.spec\\.ts$',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/nevo_server/src/$1',
  },
  collectCoverageFrom: ['<rootDir>/nevo_server/src/**/*.ts', '!**/*.spec.ts'],
  coverageDirectory: '<rootDir>/coverage',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/nevo_server/tsconfig.json',
    }],
  },
};

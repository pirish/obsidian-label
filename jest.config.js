module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'CommonJS',
          lib: ['DOM', 'ES2022'],
          esModuleInterop: true
        }
      }
    ]
  },
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/tests/mocks/obsidian.ts'
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node']
};

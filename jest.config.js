module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ["**/tests/**/*.test.ts", "**/tests/**/*.test.tsx", "**/tests/**/*.spec.ts", "**/tests/**/*.spec.tsx"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/tests/e2e/"],
  moduleFileExtensions: ['ts','tsx','js','jsx','json','node'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  }
}

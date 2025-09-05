module.exports = {
  "testEnvironment": "node",
  "preset": "ts-jest",
  "testMatch": [
    "**/__tests__/**/*.test.{js,ts}",
    "**/?(*.)+(spec|test).{js,ts}"
  ],
  "collectCoverageFrom": [
    "*.{js,ts}",
    "!*.d.ts",
    "!jest.config.ts",
    "!dist/**"
  ],
  "coverageReporters": [
    "text",
    "lcov",
    "html"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  },
  "testTimeout": 30000,
  "maxWorkers": 1,
  "forceExit": true,
  "detectOpenHandles": true,
  "verbose": true,
  "testPathIgnorePatterns": [
    "/node_modules/",
    "/dist/",
    "/build/"
  ],
  "watchPathIgnorePatterns": [
    "/node_modules/",
    "/dist/",
    "/build/"
  ]
};
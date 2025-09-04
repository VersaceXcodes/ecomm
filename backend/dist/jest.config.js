module.exports = {
    "testEnvironment": "node",
    "setupFilesAfterEnv": [
        "<rootDir>/tests/setup.js"
    ],
    "testMatch": [
        "**/__tests__/**/*.test.js",
        "**/?(*.)+(spec|test).js"
    ],
    "collectCoverageFrom": [
        "src/**/*.{js,ts}",
        "!src/**/*.d.ts",
        "!src/tests/**"
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
    "transform": {
        "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
    },
    "moduleNameMapping": {
        "^@/(.*)$": "<rootDir>/src/$1"
    },
    "testPathIgnorePatterns": [
        "/node_modules/",
        "/dist/",
        "/build/"
    ],
    "watchPathIgnorePatterns": [
        "/node_modules/",
        "/dist/",
        "/build/"
    ],
    "preset": "ts-jest"
};
export {};
//# sourceMappingURL=jest.config.js.map
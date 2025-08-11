module.exports = {
  testEnvironment: "node", // Since you're testing a backend
  collectCoverage: true,
  verbose: true,
  testMatch: ["<rootDir>/tests/**/*.test.js"], // Ensures tests run only from the `tests` folder
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"], // Optional, for global setup
  moduleDirectories: ["node_modules", "<rootDir>"], // Allows for absolute imports
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/Api/config",
    "/Api/tests/setup/",
    "/models/associations.js",
    "/models/index.js",
    "server.js",
    "app.js",
  ],
  collectCoverageFrom: [
    "**/models/**/*.js", // Include all model files
    "**/controllers/**/*.js", // Include all controller files
    "!**/node_modules/**", // Exclude node_modules
    "!**/coverage/**", // Exclude coverage directory
    "!**/jest.config.js", // Exclude Jest config file
  ],
  maxWorkers: 1,
};
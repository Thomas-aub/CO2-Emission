/**  @type {import('jest').Config} */
const config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  testResultsProcessor: "jest-sonar-reporter",
  collectCoverageFrom: [
    "__tests__/**/*.js",
    "controllers/**/*.js",
    "services/**/*.js",
    "routes/**/*.js",
    "middlewares/**/*.js",
    "utils/**/*.js",
    "app.js",
    "server.js"
  ],
  coverageReporters: ["json", "lcov", "text", "clover"]
};

module.exports = config;
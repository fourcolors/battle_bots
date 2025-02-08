module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/test/integration/**/*.test.ts"],
    setupFilesAfterEnv: ["<rootDir>/test/integration/setup.ts"],
  };
module.exports = {
  collectCoverage: true,
  // collectCoverageFrom: ['packages/**/*.{js}', '!**/node_modules/**'],
  coverageDirectory: 'output/coverage/jest',
  preset: 'jest-puppeteer',
  coverageReporters: ['text', 'cobertura'],
  roots: ['packages/']
}

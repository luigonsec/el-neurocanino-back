module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: { ...require('./tsconfig.json').compilerOptions, rootDir: '.' } },
    ],
  },
  testMatch: ['**/test/**/*.spec.ts'],
};

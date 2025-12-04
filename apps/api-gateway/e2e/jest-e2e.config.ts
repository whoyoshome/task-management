export default {
  displayName: 'api-gateway-e2e',
  preset: '../../../jest.preset.js', 
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      { tsconfig: '<rootDir>/../tsconfig.spec.json' },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  testMatch: ['<rootDir>/specs/**/*.e2e-spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],  
  coverageDirectory: '../../coverage/apps/api-gateway-e2e',
  rootDir: '.',
};

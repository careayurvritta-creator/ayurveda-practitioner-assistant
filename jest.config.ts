import type { Config } from 'jest';

const config: Config = {
  roots: ['<rootDir>/src'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      jsx: 'react-jsx',
    }],
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/reference-hospital/'],
  collectCoverageFrom: [
    'src/features/hims/**/*.ts',
    'src/features/hims/**/*.tsx',
    '!src/**/*.d.ts',
  ],
};

export default config;

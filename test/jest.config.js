module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
        '../src/**/*.(t|j)s',
        '!../src/**/*.spec.ts',
        '!../src/**/*.interface.ts',
        '!../src/**/*.enum.ts',
        '!../src/**/*.dto.ts',
        '!../src/main.ts',
    ],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    moduleNameMapping: {
        '^src/(.*)$': '<rootDir>/../src/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/setup.ts'],
};

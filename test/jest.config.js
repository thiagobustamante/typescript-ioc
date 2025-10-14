module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',

    testMatch: [
        '**/unit/**/*.(spec|test).[jt]s?(x)',
    ],

    collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/**/*.d.ts',
    ],

    coverageDirectory: 'reports/coverage',

    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },

    transform: {
        '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }]
    }
};

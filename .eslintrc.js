module.exports = {
    env: {
        es6: true,
        node: true
    },
    ignorePatterns: ['.eslintrc.js', 'jest.config.js'],
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'prettier'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: ['tsconfig.json', 'test/tsconfig.json'],
        sourceType: 'module'
    },
    plugins: ['eslint-plugin-jsdoc', 'eslint-plugin-prefer-arrow', '@typescript-eslint'],
    root: true,
    rules: {
        '@typescript-eslint/adjacent-overload-signatures': 'error',
        '@typescript-eslint/array-type': [
            'error',
            {
                default: 'generic'
            }
        ],
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/consistent-type-assertions': 'error',
        '@typescript-eslint/dot-notation': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/indent': 'off',
        '@typescript-eslint/member-delimiter-style': [
            'error',
            {
                multiline: {
                    delimiter: 'semi',
                    requireLast: true
                },
                singleline: {
                    delimiter: 'semi',
                    requireLast: false
                }
            }
        ],
        '@typescript-eslint/naming-convention': [
            'off',
            {
                selector: 'variable',
                format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
                leadingUnderscore: 'allow',
                trailingUnderscore: 'forbid'
            }
        ],
        '@typescript-eslint/no-empty-function': 'error',
        '@typescript-eslint/no-empty-interface': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'error',
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/no-shadow': [
            'error',
            {
                hoist: 'all'
            }
        ],
        '@typescript-eslint/no-unused-expressions': 'error',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/prefer-for-of': 'error',
        '@typescript-eslint/prefer-function-type': 'error',
        '@typescript-eslint/prefer-namespace-keyword': 'error',
        '@typescript-eslint/quotes': ['error', 'single'],
        '@typescript-eslint/semi': ['error', 'always'],
        '@typescript-eslint/triple-slash-reference': [
            'error',
            {
                path: 'always',
                types: 'prefer-import',
                lib: 'always'
            }
        ],
        '@typescript-eslint/type-annotation-spacing': 'off',
        '@typescript-eslint/typedef': 'off',
        '@typescript-eslint/unified-signatures': 'error',
        'arrow-parens': ['off', 'always'],
        'brace-style': ['off', 'off'],
        'comma-dangle': 'off',
        complexity: 'off',
        'constructor-super': 'error',
        'dot-notation': 'off',
        'eol-last': 'off',
        eqeqeq: ['error', 'smart'],
        'guard-for-in': 'error',
        'id-denylist': [
            'error',
            'any',
            'Number',
            'number',
            'String',
            'string',
            'Boolean',
            'boolean',
            'Undefined',
            'undefined'
        ],
        'id-match': 'error',
        indent: 'off',
        'jsdoc/check-alignment': 'error',
        'jsdoc/check-indentation': 'error',
        // "jsdoc/newline-after-description": "error",
        'linebreak-style': 'off',
        'max-classes-per-file': 'off',
        'max-len': 'off',
        'new-parens': 'off',
        'newline-per-chained-call': 'off',
        'no-bitwise': 'error',
        'no-caller': 'error',
        'no-cond-assign': 'error',
        'no-console': [
            'error',
            {
                allow: [
                    'warn',
                    'dir',
                    'time',
                    'timeEnd',
                    'timeLog',
                    'trace',
                    'assert',
                    'clear',
                    'count',
                    'countReset',
                    'group',
                    'groupEnd',
                    'table',
                    'debug',
                    'info',
                    'dirxml',
                    'groupCollapsed',
                    'Console',
                    'profile',
                    'profileEnd',
                    'timeStamp',
                    'context',
                    'createTask'
                ]
            }
        ],
        'no-debugger': 'error',
        'no-empty': 'error',
        'no-empty-function': 'off',
        'no-eval': 'error',
        'no-extra-semi': 'off',
        'no-fallthrough': 'off',
        'no-invalid-this': 'off',
        'no-irregular-whitespace': 'off',
        'no-multiple-empty-lines': 'off',
        'no-new-wrappers': 'error',
        'no-shadow': 'off',
        'no-throw-literal': 'error',
        'no-trailing-spaces': 'off',
        'no-undef-init': 'error',
        'no-underscore-dangle': 'off',
        'no-unsafe-finally': 'error',
        'no-unused-expressions': 'off',
        'no-unused-labels': 'error',
        'no-use-before-define': 'off',
        'no-var': 'error',
        'object-shorthand': ['error', 'never'],
        'one-var': ['error', 'never'],
        'padded-blocks': [
            'off',
            {
                blocks: 'never'
            },
            {
                allowSingleLineBlocks: true
            }
        ],
        'prefer-arrow/prefer-arrow-functions': [
            'error',
            {
                allowStandaloneDeclarations: true
            }
        ],
        'prefer-const': 'error',
        'quote-props': 'off',
        quotes: 'off',
        radix: 'error',
        'react/jsx-curly-spacing': 'off',
        'react/jsx-equals-spacing': 'off',
        'react/jsx-tag-spacing': [
            'off',
            {
                afterOpening: 'allow',
                closingSlash: 'allow'
            }
        ],
        'react/jsx-wrap-multilines': 'off',
        semi: 'off',
        'space-before-function-paren': 'off',
        'space-in-parens': ['off', 'never'],
        'spaced-comment': [
            'error',
            'always',
            {
                markers: ['/']
            }
        ],
        'use-isnan': 'error',
        'valid-typeof': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        'constructor-super': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }
        ]
    }
};

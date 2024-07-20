module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        sourceType: 'module'
    },
    plugins: ['@typescript-eslint/eslint-plugin'],
    extends: [
        'plugin:prettier/recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    root: true,
    env: {
        node: true,
        jest: true
    },
    overrides: [
        {
            'files': ['*.e2e-spec.ts', 'country.helper.ts', '*.spec.ts'],
            'rules': {
                'max-lines-per-function': 'off',
                'max-lines': 'off',
            }
        }
    ],
    ignorePatterns: ['.eslintrc.js'],
    rules: {
        'max-lines': ['error', {
            max: 400,
            skipComments: true
        }],
        'max-lines-per-function': ['error', {
            max: 100,
            skipComments: true
        }],
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { 'args': 'none' }],
        'indent': 'off',
        'prettier/prettier': [
            'error',
            {
                'useTabs': false,
                'tabWidth': 4,
                'printWidth': 120,
                'singleQuote': true,
                'trailingComma': 'none'
            }
        ],
        'prefer-const': 'off',
        '@typescript-eslint/ban-types': ['error', {
            types: {
                Object: false,
                Function: false
            }
        }]
    }
};


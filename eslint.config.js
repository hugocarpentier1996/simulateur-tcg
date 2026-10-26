import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/**', '**/dist/**', 'work/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['packages/game-engine/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'react',
            'react/*',
            'node:*',
            'socket.io',
            'socket.io-client',
            'pg',
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message: 'Injecter le hasard pour garder le moteur reproductible.',
        },
        {
          selector:
            "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Injecter le temps.',
        },
        {
          selector: "NewExpression[callee.name='Date']",
          message: 'Injecter le temps.',
        },
        {
          selector:
            "CallExpression[callee.object.name='crypto'][callee.property.name='randomUUID']",
          message: 'Injecter les identifiants.',
        },
      ],
    },
  },
);

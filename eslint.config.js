// @ts-check
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

const forbid = (patterns, message) => ({
  group: patterns,
  message,
});

// Matches both the bare barrel import ('../../programmes') and any deeper
// path into that module ('../../programmes/service/...').
const wholeModule = (name) => [`**/${name}`, `**/${name}/**`];

module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'eslint.config.js', 'jest.config.js'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  // Module boundary: staff is foundational and must not depend on any other module.
  {
    files: ['src/staff/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          forbid(
            [...wholeModule('activities'), ...wholeModule('programmes'), ...wholeModule('alerts'), ...wholeModule('reports')],
            'staff is a foundational module and must not depend on other modules.',
          ),
        ],
      }],
    },
  },
  // activities: may only read staff via its public index; no sibling/downstream deps.
  {
    files: ['src/activities/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          forbid(['**/staff/service/*', '**/staff/repository/*', '**/staff/routes/*'],
            'Import staff only through its public index (read-only API).'),
          forbid(wholeModule('programmes'), 'activities must not depend on programmes.'),
          forbid(wholeModule('alerts'), 'activities must not depend on alerts; use the event bus instead.'),
          forbid(wholeModule('reports'), 'activities must not depend on reports.'),
        ],
      }],
    },
  },
  // programmes: mirrors activities.
  {
    files: ['src/programmes/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          forbid(['**/staff/service/*', '**/staff/repository/*', '**/staff/routes/*'],
            'Import staff only through its public index (read-only API).'),
          forbid(wholeModule('activities'), 'programmes must not depend on activities.'),
          forbid(wholeModule('alerts'), 'programmes must not depend on alerts; use the event bus instead.'),
          forbid(wholeModule('reports'), 'programmes must not depend on reports.'),
        ],
      }],
    },
  },
  // alerts: reacts only to the event bus; must not depend on any other module directly.
  {
    files: ['src/alerts/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          forbid(
            [...wholeModule('staff'), ...wholeModule('activities'), ...wholeModule('programmes'), ...wholeModule('reports')],
            'alerts must only communicate via the shared event bus, not direct module imports.',
          ),
        ],
      }],
    },
  },
  // reports: read-only aggregator; may use other modules' public indexes only.
  {
    files: ['src/reports/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          forbid(
            [
              '**/staff/service/*', '**/staff/repository/*', '**/staff/routes/*',
              '**/activities/service/*', '**/activities/repository/*', '**/activities/routes/*',
              '**/programmes/service/*', '**/programmes/repository/*', '**/programmes/routes/*',
              '**/alerts/service/*', '**/alerts/repository/*', '**/alerts/routes/*', '**/alerts/listener/*',
            ],
            'reports may only use another module\'s public index, not its internals.',
          ),
        ],
      }],
    },
  },
);

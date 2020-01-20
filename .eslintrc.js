
const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  extends: 'airbnb-base',
  rules: {
    'no-continue': OFF,
    'no-console': OFF,
    'no-control-regex': OFF,
    'consistent-return': OFF,
    'no-cond-assign': OFF,
    'no-plusplus': OFF,
    'quote-props': OFF,
    'prefer-const': OFF,
    'func-names': OFF,
    'max-len': OFF,
    'no-param-reassign': OFF,
    'no-return-assign': OFF,
    'comma-dangle': [ERROR, 'only-multiline'],
    'no-underscore-dangle': ERROR,
    'no-unused-vars': [ERROR, { args: 'after-used' }],
    'no-empty': [ERROR, { allowEmptyCatch: true }],
    'import/no-extraneous-dependencies': OFF,
    'import/extensions': OFF,
    'import/no-unresolved': OFF,
    'import/prefer-default-export': OFF
  },
  env: {
    node: true,
    browser: true,
    es6: true,
    worker: true,
    serviceworker: true
  }
}

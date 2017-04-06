
const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  parser: 'babel-eslint',
  extends: 'airbnb',
  rules: {
    'no-console': OFF, // speical for the project
    'no-continue': OFF,
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
    'import/no-extraneous-dependencies': OFF,
    'import/extensions': OFF,
    'import/no-unresolved': OFF,
    'import/no-dynamic-require': OFF
  },
  env: {
    node: true,
    browser: true,
    es6: true,
    worker: true,
    serviceworker: true
  }
}

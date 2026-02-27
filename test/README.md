# Tests

This directory contains fixture inputs plus integration/regression tests for the
CLI.

## Fixture files

These are fed to `dist/cli.js` by the test harness:

- **`_simple-test.js`**: basic passing TAP output
- **`_tape-test.js`**: multiple assertions, including async output
- **`_failing-test.js`**: explicit TAP failure plus thrown error
- **`_timeout-test.js`**: never-ending test used for timeout handling
- **`_timeout_test.js`**: 6-second delayed pass used by timeout option tests
- **`_timeout-validation-test.js`**: checks timeout query param plumbing
- **`_missing-element-test.js`**: logs an error without throwing
- **`_unhandled-rejection-test.js`**: unhandled promise rejection case
- **`_uncaught-exception-test.js`**: uncaught exception case
- **`_vite-env-test.js`**: validates `import.meta.env` transforms

## Main test suites

- **`index.ts`**: primary CLI integration tests (`npm run test:unit`)
- **`timeout-option-test.js`**: timeout/`-t` behavior tests (`npm run test:timeout`)

Additional `*.test.js` files in this directory are focused regression scenarios
that are not part of the default `npm test` script.

## npm scripts

```bash
npm run test:unit      # Runs test/index.ts
npm run test:timeout   # Runs timeout option tests
npm test               # Runs both test suites above
```

## Manual usage examples

```bash
# Run a fixture through the local CLI build
cat test/_simple-test.js | node dist/cli.js

# Same with a custom timeout
cat test/_timeout_test.js | node dist/cli.js --timeout 10000
```

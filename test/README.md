# Test Examples

This directory contains example tests.

## Test Files

- **`simple-test.js`** - Basic passing test using TAP format
- **`tape-test.js`** - Complex test with async operations and multiple assertions  
- **`failing-test.js`** - Test that intentionally fails to demonstrate error handling
- **`timeout-test.js`** - Test that runs indefinitely to demonstrate timeout behavior
- **`index.ts`** - Unit tests for the tapout module itself

## npm Scripts

You can run the example tests with npm scripts:

```bash
npm run test:simple     # Basic passing test
npm run test:complex    # Complex async test
npm run test:failing    # Failing test (exits with code 1)
npm run test:timeout    # Timeout test

# Run all passing tests
npm run test:all-examples

# Run unit tests for the module
npm test
```

## Usage Examples

These demonstrate how to use tapout with different types of JavaScript test code:

```bash
# Basic usage
cat test/simple-test.js | npx tapout

# In a pipeline with bundlers
browserify test/my-tests.js | npx tapout
esbuild test/my-tests.js --bundle | npx tapout
```

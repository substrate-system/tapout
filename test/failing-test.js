// Example: Test that demonstrates failure detection
// This test intentionally fails to show error handling
console.log('TAP version 13')
console.log('1..2')

console.log('ok 1 - this test passes')
console.log('not ok 2 - this test fails')

// Also test error handling
throw new Error('This is a test error')

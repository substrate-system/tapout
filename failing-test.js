// Test with a failure
console.log('TAP version 13')
console.log('1..2')

console.log('ok 1 - this test passes')
console.log('not ok 2 - this test fails')

// Also test error handling
throw new Error('This is a test error')

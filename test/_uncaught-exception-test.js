// Test file that contains an uncaught exception to verify error detection
console.log('TAP version 13')
console.log('1..1')

console.log('ok 1 - test with uncaught exception')

// Create an uncaught exception
setTimeout(() => {
    throw new Error('Test uncaught exception')
}, 100)

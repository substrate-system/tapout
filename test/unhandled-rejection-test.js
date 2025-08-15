// Test file that contains an unhandled promise rejection to verify error detection
console.log('TAP version 13')
console.log('1..1')

// Create an unhandled promise rejection
setTimeout(() => {
    Promise.reject(new Error('Test unhandled rejection'))
}, 100)

console.log('ok 1 - test with unhandled rejection')

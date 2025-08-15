// Test file that uses console.error to log errors
console.log('TAP version 13')
console.log('1..1')

console.log('ok 1 - test that logs error')

// Log an error that should be detected
setTimeout(() => {
    console.error('Error: Something went wrong in the test')
}, 100)

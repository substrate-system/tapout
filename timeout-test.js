// Test that causes a real timeout
console.log('TAP version 13')
console.log('1..1')
console.log('ok 1 - this test starts')

// Override the auto-finish behavior to prevent completion
window.testsFinished = false
window.testsFailed = false

// Keep outputting to prevent auto-finish timer
setInterval(() => {
    console.log('Still running...')
}, 200)

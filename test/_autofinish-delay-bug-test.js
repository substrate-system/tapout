// This test demonstrates the auto-finish delay bug
// With -t 10000 (10 second timeout):
// - Test runs for 2 seconds
// - Auto-finish delay is 80% of timeout = 8 seconds
// - Total time: 2s + 8s = 10s (equals timeout exactly)
// - page.waitForFunction times out before window.testsFinished is set

console.log('TAP version 13')
console.log('1..1')

setTimeout(() => {
    console.log('ok 1 - test completed after 2 seconds')
    // Don't explicitly set window.testsFinished
    // Let the auto-finish mechanism handle it
    // With the bug, the auto-finish delay is 8 seconds (80% of 10s timeout)
    // So the page will timeout before auto-finish sets window.testsFinished
}, 2000)

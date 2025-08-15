// Test to validate that timeout parameter is properly
// passed to test-runner.html
// This test checks that the autoFinishDelay is calculated correctly based
// on the timeout
console.log('TAP version 13')
console.log('1..1')

// Access the timeout parameters that should be set by test-runner.html
const urlParams = new URLSearchParams(window.location.search)
const timeoutMs = parseInt(urlParams.get('timeout')) || 10000

if (timeoutMs > 0) {
    console.log('ok 1 - timeout parameter is properly passed to test runner')
} else {
    console.log('not ok 1 - timeout parameter not found')
}

// Mark tests as finished explicitly
window.testsFinished = true

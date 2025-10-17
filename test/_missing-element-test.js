// Test that should FAIL when an element is not found
// This simulates a common pattern where test utilities log errors
// but don't throw, expecting the test runner to catch the error

console.log('TAP version 13')
console.log('1..1')

// Try to find an element that doesn't exist
const element = document.querySelector('.element-that-does-not-exist')

if (!element) {
    // Log error without throwing - this is what many test utilities do
    console.error('Error: Element not found: .element-that-does-not-exist')
    console.log('not ok 1 - should find element')
    throw new Error('not found')
} else {
    console.log('ok 1 - should find element')
}

// Mark test as complete
window.testsFinished = true

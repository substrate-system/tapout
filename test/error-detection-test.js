// Test file to verify error detection works properly
console.log('TAP version 13')
console.log('1..3')

// Test 1: Regular passing test
console.log('ok 1 - basic test passes')

// Test 2: Unhandled promise rejection
Promise.reject(new Error('This is an unhandled promise rejection'))
    .catch(() => {
        // This catch prevents the rejection, let's make it unhandled
    })

// Actually create an unhandled rejection
setTimeout(() => {
    Promise.reject(new Error('Unhandled promise rejection test'))
}, 100)

// Test 3: Uncaught exception
setTimeout(() => {
    throw new Error('Uncaught exception test')
}, 200)

setTimeout(() => {
    console.log('ok 2 - async operations started')
    console.log('ok 3 - test file completed')
}, 300)

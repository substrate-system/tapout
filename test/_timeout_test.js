import { test } from '@substrate-system/tapzero'

// This is a fixture test that takes 6 seconds to complete
// It will be bundled and passed to the CLI for timeout testing
test('long running test', (t) => {
    console.log('# Test starting - will run for 6 seconds')
    
    return new Promise(resolve => {
        setTimeout(() => {
            t.ok(true, 'long running test completed')
            // Explicitly mark tests as finished for the test runner
            if (typeof window !== 'undefined') {
                window.testsFinished = true
            }
            resolve()
        }, 6000)
    })
})

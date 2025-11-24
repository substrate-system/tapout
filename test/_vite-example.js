/**
 * Example of real-world Vite code that would crash without env support
 * This simulates how a typical Vite app would use environment variables
 */

console.log('TAP version 13')
console.log('1..3')

// Example 1: Conditional logic based on dev mode (common in Vite apps)
if (import.meta.env.DEV) {
    console.log('ok 1 - running in development mode')
} else {
    console.log('not ok 1 - should be in development mode')
}

// Example 2: API endpoint based on environment (typical Vite pattern)
const apiUrl = import.meta.env.DEV
    ? 'http://localhost:3000/api'
    : 'https://production.api.com'

if (apiUrl === 'http://localhost:3000/api') {
    console.log('ok 2 - API URL correctly set for dev environment')
} else {
    console.log('not ok 2 - API URL should be localhost in dev')
}

// Example 3: Feature flag based on mode (common in Vite apps)
const enableDebugFeatures = import.meta.env.MODE === 'test' || import.meta.env.DEV

if (enableDebugFeatures) {
    console.log('ok 3 - debug features enabled')
} else {
    console.log('not ok 3 - debug features should be enabled')
}

// @ts-ignore
window.testsFinished = true

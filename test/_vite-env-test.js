/**
 * Test file that uses Vite environment variables
 * This simulates code from a Vite app that would crash without env support
 */

console.log('TAP version 13')
console.log('1..5')

// Test import.meta.env.DEV
try {
    const isDev = import.meta.env.DEV
    console.log(`ok 1 - import.meta.env.DEV is defined (${isDev})`)
} catch (error) {
    console.log('not ok 1 - import.meta.env.DEV caused error:', error.message)
}

// Test import.meta.env.PROD
try {
    const isProd = import.meta.env.PROD
    console.log(`ok 2 - import.meta.env.PROD is defined (${isProd})`)
} catch (error) {
    console.log('not ok 2 - import.meta.env.PROD caused error:', error.message)
}

// Test import.meta.env.MODE
try {
    const mode = import.meta.env.MODE
    console.log(`ok 3 - import.meta.env.MODE is defined (${mode})`)
} catch (error) {
    console.log('not ok 3 - import.meta.env.MODE caused error:', error.message)
}

// Test import.meta.env.BASE_URL
try {
    const baseUrl = import.meta.env.BASE_URL
    console.log(`ok 4 - import.meta.env.BASE_URL is defined (${baseUrl})`)
} catch (error) {
    console.log('not ok 4 - import.meta.env.BASE_URL caused error:', error.message)
}

// Test import.meta.env.SSR
try {
    const isSsr = import.meta.env.SSR
    console.log(`ok 5 - import.meta.env.SSR is defined (${isSsr})`)
} catch (error) {
    console.log('not ok 5 - import.meta.env.SSR caused error:', error.message)
}

// @ts-ignore
window.testsFinished = true

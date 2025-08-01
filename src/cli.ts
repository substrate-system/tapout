#!/usr/bin/env node

import { readStdin, runTestsInBrowser } from './index.js'

async function main () {
    try {
        const testCode = await readStdin()
        if (!testCode.trim()) {
            console.error('No test code provided via stdin')
            process.exit(1)
        }

        await runTestsInBrowser(testCode)
    } catch (error) {
        console.error('Error running tests:', error)
        process.exit(1)
    }
}

main()

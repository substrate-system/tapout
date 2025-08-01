#!/usr/bin/env node

import { readStdin, runTestsInBrowser } from './index.js'

function parseArgs () {
    const args = process.argv.slice(2)
    let timeout = 10000 // default 10 seconds

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--timeout' || args[i] === '-t') {
            const timeoutValue = parseInt(args[i + 1], 10)
            if (isNaN(timeoutValue) || timeoutValue <= 0) {
                console.error('Error: timeout must be a positive number in milliseconds')
                process.exit(1)
            }
            timeout = timeoutValue
            i++ // skip the next argument since we consumed it
        } else if (args[i] === '--help' || args[i] === '-h') {
            console.log(`Usage: tapout [options]
            
Options:
  -t, --timeout <ms>    Timeout in milliseconds (default: 10000)
  -h, --help           Show this help message

Example:
  cat test.js | tapout --timeout 5000`)
            process.exit(0)
        } else {
            console.error(`Unknown option: ${args[i]}`)
            console.error('Use --help for usage information')
            process.exit(1)
        }
    }

    return { timeout }
}

async function main () {
    try {
        const { timeout } = parseArgs()

        const testCode = await readStdin()
        if (!testCode.trim()) {
            console.error('No test code provided via stdin')
            process.exit(1)
        }

        await runTestsInBrowser(testCode, { timeout })
    } catch (error) {
        console.error('Error running tests:', error)
        process.exit(1)
    }
}

main()

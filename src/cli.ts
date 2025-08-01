#!/usr/bin/env node

import { readStdin, runTestsInBrowser } from './index.js'

function parseArgs () {
    const args = process.argv.slice(2)
    let timeout = 10000 // default 10 seconds
    let browser: 'chromium' | 'firefox' | 'webkit' = 'chromium' // default browser

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--timeout' || args[i] === '-t') {
            const timeoutValue = parseInt(args[i + 1], 10)
            if (isNaN(timeoutValue) || timeoutValue <= 0) {
                console.error('Error: timeout must be a positive number in milliseconds')
                process.exit(1)
            }
            timeout = timeoutValue
            i++ // skip the next argument since we consumed it
        } else if (args[i] === '--browser' || args[i] === '-b') {
            const browserValue = args[i + 1]
            if (!browserValue || !['chromium', 'firefox', 'webkit'].includes(browserValue)) {
                console.error('Error: browser must be one of: chromium, firefox, webkit')
                process.exit(1)
            }
            browser = browserValue as 'chromium' | 'firefox' | 'webkit'
            i++ // skip the next argument since we consumed it
        } else if (args[i] === '--help' || args[i] === '-h') {
            console.log(`Usage: tapout [options]
            
Options:
  -t, --timeout <ms>    Timeout in milliseconds (default: 10000)
  -b, --browser <name>  Browser to use: chromium, firefox, webkit (default: chromium)
  -h, --help           Show this help message

Examples:
  cat test.js | tapout --timeout 5000
  cat test.js | tapout --browser firefox
  cat test.js | tapout -b webkit -t 3000`)
            process.exit(0)
        } else {
            console.error(`Unknown option: ${args[i]}`)
            console.error('Use --help for usage information')
            process.exit(1)
        }
    }

    return { timeout, browser }
}

async function main () {
    try {
        const { timeout, browser } = parseArgs()

        const testCode = await readStdin()
        if (!testCode.trim()) {
            console.error('No test code provided via stdin')
            process.exit(1)
        }

        await runTestsInBrowser(testCode, { timeout, browser })
    } catch (error) {
        console.error('Error running tests:', error)
        process.exit(1)
    }
}

main()

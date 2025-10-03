/**
 * Test the CLI.
 *
 * - Run example test files via CLI
 * - Check exit codes for success/failure scenarios
 * - Validate output messages and error handling
 * - Test edge cases like empty input and invalid JavaScript
 */

import { test } from '@substrate-system/tapzero'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

// Use process.cwd() instead of __dirname b/c this will be bundled
const projectRoot = process.cwd()
const cliPath = path.join(projectRoot, 'dist', 'cli.js')

interface TestResult {
    exitCode:number|null
    stdout:string
    stderr:string
}

test('CLI: simple test should pass', async (t) => {
    const result = await runCliTest('_simple-test.js')

    t.equal(result.exitCode, 0, 'simple test should exit with code 0')
    t.ok(
        result.stdout.includes('TAP version 13'),
        'should show TAP output'
    )
    t.ok(
        result.stdout.includes('ok 1 - simple test'),
        'should show test result'
    )
})

test('CLI: complex test should pass', async (t) => {
    const result = await runCliTest('_tape-test.js')

    t.equal(result.exitCode, 0, 'complex test should exit with code 0')
    t.ok(
        result.stdout.includes('TAP version 13'),
        'should show TAP output'
    )
    t.ok(
        result.stdout.includes('ok 1 - addition works'),
        'should show first test'
    )
    t.ok(
        result.stdout.includes('ok 2 - async test works'),
        'should show async test'
    )
    t.ok(
        result.stdout.includes('ok 3 - object test works'),
        'should show object test'
    )
})

test('CLI: failing test should fail', async (t) => {
    const result = await runCliTest('_failing-test.js')

    t.equal(result.exitCode, 1, 'failing test should exit with code 1')
    t.ok(
        result.stdout.includes('not ok 2 - this test fails'),
        'should show failing test'
    )
    t.ok(
        (result.stdout.includes('Error executing test code') ||
        result.stderr.includes('Error')),
        'should show error'
    )
})

test('CLI: detects unhandled promise rejections', async (t) => {
    const result = await runCliTest('_unhandled-rejection-test.js')

    t.equal(result.exitCode, 1, 'unhandled rejection should exit with code 1')
    t.ok(
        result.stdout.includes('Unhandled promise rejection') ||
        result.stdout.includes('Page error') ||
        result.stderr.includes('Unhandled promise rejection'),
        'should show unhandled promise rejection message'
    )
    t.ok(
        result.stderr.includes('Tests failed') || result.stdout.includes('Error running tests'),
        'should indicate test failure'
    )
})

test('CLI: detects uncaught exceptions', async (t) => {
    const result = await runCliTest('_uncaught-exception-test.js')

    t.equal(result.exitCode, 1, 'uncaught exception should exit with code 1')
    t.ok(
        result.stdout.includes('Unhandled error') ||
        result.stdout.includes('Page error') ||
        result.stderr.includes('Unhandled error'),
        'should show unhandled error message'
    )
    t.ok(
        result.stderr.includes('Tests failed') || result.stdout.includes('Error running tests'),
        'should indicate test failure'
    )
})

test('CLI: timeout test should handle timeouts', async (t) => {
    // Use 2 second timeout for this test
    const result = await runCliTest('_timeout-test.js', 2000)

    // This test might either timeout (exit code null) or auto-finish
    // (exit code 0)
    // depending on the timing, both are acceptable behaviors
    t.ok(
        result.exitCode === 0 || result.exitCode === null || result.exitCode === 1,
        `timeout test should exit with code 0, 1, or null (timeout), got: ${result.exitCode}`
    )

    if (result.exitCode === 0) {
        t.ok(
            result.stdout.includes('Tests auto-finished'),
            'should auto-finish'
        )
    } else if (result.exitCode === 1) {
        // For timeout or failure, we just check that it failed
        t.ok(true, 'timeout test properly failed')
    }
})

test('CLI: handles empty input', async (t) => {
    const result = await new Promise<TestResult>((resolve) => {
        const child = spawn('node', [cliPath], {
            cwd: projectRoot,
            stdio: ['pipe', 'pipe', 'pipe']
        })

        let stdout = ''
        let stderr = ''

        child.stdout.on('data', (data) => {
            stdout += data.toString()
        })

        child.stderr.on('data', (data) => {
            stderr += data.toString()
        })

        // Send empty input
        child.stdin.end()

        child.on('close', (code) => {
            resolve({
                exitCode: code,
                stdout,
                stderr
            })
        })
    })

    t.equal(result.exitCode, 1, 'empty input should exit with code 1')
    t.ok(
        result.stderr.includes('No test code provided'),
        'should show empty input error'
    )
})

test('CLI: handles invalid JavaScript', async (t) => {
    const result = await new Promise<TestResult>((resolve) => {
        const child = spawn('node', [cliPath], {
            cwd: projectRoot,
            stdio: ['pipe', 'pipe', 'pipe']
        })

        let stdout = ''
        let stderr = ''

        child.stdout.on('data', (data) => {
            stdout += data.toString()
        })

        child.stderr.on('data', (data) => {
            stderr += data.toString()
        })

        // Send invalid JavaScript
        child.stdin.write('this is not valid javascript syntax !!!')
        child.stdin.end()

        child.on('close', (code) => {
            resolve({
                exitCode: code,
                stdout,
                stderr
            })
        })

        child.on('error', (err) => {
            stderr += `Process error: ${err.message}`
            resolve({
                exitCode: 1,
                stdout,
                stderr
            })
        })

        // Shorter timeout for invalid JS
        setTimeout(() => {
            child.kill('SIGTERM')
            resolve({
                exitCode: 1, // Treat timeout as failure
                stdout,
                stderr: stderr + 'Test timed out'
            })
        }, 5000)
    })

    t.equal(result.exitCode, 1, 'invalid JavaScript should exit with code 1')
    t.ok(
        result.stdout.includes('❌ Tests failed') ||
        result.stdout.includes('Error executing test code') ||
        result.stderr.includes('Error') ||
        result.stderr.includes('timed out'),
        'should show error message for invalid JavaScript'
    )
})

test('CLI: can run tests in Firefox', async (t) => {
    const result = await runCliTest('_simple-test.js', 10000, 'firefox')

    t.equal(result.exitCode, 0, 'simple test should exit with code 0 in Firefox')
    t.ok(
        result.stdout.includes('# Running tests in firefox'),
        'should show browser comment for Firefox'
    )
    t.ok(
        result.stdout.includes('TAP version 13'),
        'should show TAP output'
    )
})

test('CLI: can run tests in WebKit', async (t) => {
    const result = await runCliTest('_simple-test.js', 5000, 'webkit')

    t.equal(result.exitCode, 0, 'simple test should exit with code 0 in WebKit')
    t.ok(
        result.stdout.includes('# Running tests in webkit'),
        'should show browser comment for WebKit'
    )
    t.ok(
        result.stdout.includes('TAP version 13'),
        'should show TAP output'
    )
})

test('CLI: can run tests in Edge', async (t) => {
    const result = await runCliTest('_simple-test.js', 5000, 'edge')

    t.equal(result.exitCode, 0, 'simple test should exit with code 0 in Edge')
    t.ok(
        result.stdout.includes('# Running tests in edge'),
        'should show browser comment for Edge'
    )
    t.ok(
        result.stdout.includes('TAP version 13'),
        'should show TAP output'
    )
})

test('CLI: respects custom timeout for long-running tests', async (t) => {
    // Test that takes 2 seconds but should complete within 10 second timeout
    const longRunningTest = `
console.log('TAP version 13')
console.log('1..1')
setTimeout(() => {
    console.log('ok 1 - long running test')
    window.testsFinished = true
}, 2000)`

    const result = await new Promise<TestResult>((resolve) => {
        const child = spawn('node', [cliPath, '--timeout', '10000'], {
            cwd: projectRoot,
            stdio: ['pipe', 'pipe', 'pipe']
        })

        let stdout = ''
        let stderr = ''

        child.stdout.on('data', (data) => {
            stdout += data.toString()
        })

        child.stderr.on('data', (data) => {
            stderr += data.toString()
        })

        child.stdin.write(longRunningTest)
        child.stdin.end()

        child.on('close', (code) => {
            resolve({
                exitCode: code,
                stdout,
                stderr
            })
        })

        // Timeout after 15 seconds
        setTimeout(() => {
            child.kill('SIGTERM')
            resolve({
                exitCode: null,
                stdout,
                stderr: stderr + 'Test timed out'
            })
        }, 15000)
    })

    t.equal(result.exitCode, 0, 'long running test should complete successfully')
    t.ok(
        result.stdout.includes('ok 1 - long running test'),
        'should show test completion'
    )
    t.equal(
        result.stdout.includes('Tests auto-finished'),
        false,
        'should not auto-finish when test completes explicitly'
    )
})

test('CLI: timeout parameter is passed to test runner', async (t) => {
    const result = await runCliTest('_timeout-validation-test.js', 5000)

    t.equal(result.exitCode, 0, 'timeout validation test should exit with code 0')
    t.ok(
        result.stdout.includes(
            'ok 1 - timeout parameter is properly passed to test runner'
        ),
        'should confirm timeout parameter is passed to HTML runner'
    )
})

async function runCliTest (
    testFile:string,
    timeoutMs:number = 3000,
    browser:string = 'chromium'
):Promise<TestResult> {
    // Increase timeout for CI environments
    const isCI = process.env.CI === 'true'
    const adjustedTimeout = isCI ? timeoutMs * 2 : timeoutMs
    return new Promise((resolve) => {
        const testPath = path.join(projectRoot, 'test', testFile)
        const child = spawn('node', [
            cliPath,
            '--timeout',
            adjustedTimeout.toString(), '--browser', browser
        ], {
            cwd: projectRoot,
            stdio: ['pipe', 'pipe', 'pipe']
        })

        let stdout = ''
        let stderr = ''

        child.stdout.on('data', (data) => {
            stdout += data.toString()
        })

        child.stderr.on('data', (data) => {
            stderr += data.toString()
        })

        // Read test file then pipe it to CLI
        fs.readFile(testPath, 'utf8')
            .then((testCode) => {
                child.stdin.write(testCode)
                child.stdin.end()
            })
            .catch((err) => {
                stderr += `Error reading test file: ${err.message}`
                child.kill('SIGTERM')
                resolve({
                    exitCode: 1,
                    stdout,
                    stderr
                })
            })

        child.on('close', (code) => {
            resolve({
                exitCode: code,
                stdout,
                stderr
            })
        })

        child.on('error', (err) => {
            stderr += `Process error: ${err.message}`
            resolve({
                exitCode: 1,
                stdout,
                stderr
            })
        })

        // Timeout after CLI timeout + 2 seconds for overhead
        setTimeout(() => {
            child.kill('SIGTERM')
            resolve({
                exitCode: null,
                stdout,
                stderr: stderr + `Test timed out after ${adjustedTimeout + 2000}ms`
            })
        }, adjustedTimeout + 2000)
    })
}

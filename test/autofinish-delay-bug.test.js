/**
 * Test for GitHub Issue #5: Custom timeout auto-finish delay bug
 * https://github.com/substrate-system/tapout/issues/5
 *
 * THE BUG:
 * When using `tapout -t <timeout>`, the auto-finish delay is set to 80% of the timeout.
 * This causes: test_duration + auto_finish_delay >= timeout, resulting in a timeout error.
 *
 * Example with -t 10000:
 * - Test runs for 2 seconds
 * - Auto-finish delay = Math.floor(10000 * 0.8) = 8000ms
 * - Total time: 2s + 8s = 10s = timeout exactly
 * - page.waitForFunction times out before window.testsFinished is set
 *
 * THE FIX:
 * Line 25 in test-runner.html should use:
 *   autoFinishDelay = Math.min(Math.max(timeoutMs * 0.25, 2000), 3000)
 *
 * This ensures:
 * - Tests get 75% of timeout to run (not just 20%)
 * - Auto-finish waits 2-3 seconds after last output
 * - Total time stays well under the timeout
 */

import { test } from '@substrate-system/tapzero'
import { spawn } from 'node:child_process'
import { build } from 'esbuild'
import path from 'node:path'

const projectRoot = process.cwd()
const cliPath = path.join(projectRoot, 'dist', 'cli.js')

test('Bug: Custom timeout with 2s test + 8s auto-finish = timeout', async (t) => {
    // This test demonstrates the exact scenario from the GitHub issue
    const quickTest = `
console.log('TAP version 13')
console.log('1..1')

setTimeout(() => {
    console.log('ok 1 - test completed after 2 seconds')
}, 2000)
`

    const bundledCode = await bundleTestCode(quickTest)
    const result = await runCliWithInput(bundledCode, 10000)

    // CURRENT BEHAVIOR (BUG): Test times out
    // - Exit code is 1 (error)
    // - stderr contains "Tests timed out"
    // - stdout shows the test completed and auto-finished

    // EXPECTED BEHAVIOR (AFTER FIX): Test completes successfully
    // - Exit code should be 0
    // - No timeout error
    // - Test completes and auto-finishes within timeout

    t.equal(result.exitCode, 0,
        'should exit successfully (currently fails with exit code 1)')

    t.equal(result.stderr.includes('Tests timed out'), false,
        'should not timeout (currently times out because 2s + 8s = 10s)')

    t.ok(result.stdout.includes('ok 1'),
        'should show test completion')
})

test('Bug: 3s test with 12s timeout should not timeout', async (t) => {
    const slowTest = `
console.log('TAP version 13')
console.log('1..1')

setTimeout(() => {
    console.log('ok 1 - test completed after 3 seconds')
}, 3000)
`

    const bundledCode = await bundleTestCode(slowTest)
    const result = await runCliWithInput(bundledCode, 12000)

    // CURRENT BEHAVIOR: 3s test + 9.6s auto-finish (80% of 12s) > 12s timeout
    // EXPECTED BEHAVIOR: 3s test + 3s auto-finish (max) < 12s timeout

    t.equal(result.exitCode, 0,
        'should complete successfully (currently fails)')

    t.equal(result.stderr.includes('Tests timed out'), false,
        'should not timeout with 12s timeout for 3s test')
})

test('Bug: 4s test with 10s timeout should have enough time', async (t) => {
    const mediumTest = `
console.log('TAP version 13')
console.log('1..1')

setTimeout(() => {
    console.log('ok 1 - test completed after 4 seconds')
}, 4000)
`

    const bundledCode = await bundleTestCode(mediumTest)
    const result = await runCliWithInput(bundledCode, 10000)

    // CURRENT BEHAVIOR: 4s test + 8s auto-finish > 10s timeout = FAILS
    // EXPECTED BEHAVIOR WITH FIX:
    // - autoFinishDelay = min(max(10000 * 0.25, 2000), 3000) = 3000ms
    // - Total: 4s + 3s = 7s < 10s timeout = PASSES

    t.equal(result.exitCode, 0,
        'should complete successfully (4s test + 3s auto-finish < 10s timeout)')

    t.equal(result.stderr.includes('Tests timed out'), false,
        'should not timeout - fix gives tests 7s instead of just 2s')
})

test('Verification: Proposed fix calculation is correct', async (t) => {
    // Test the proposed fix formula: min(max(timeoutMs * 0.25, 2000), 3000)

    const testCases = [
        { timeout: 5000, expected: 2000 },   // max(1250, 2000) = 2000, min(2000, 3000) = 2000
        { timeout: 10000, expected: 2500 },  // max(2500, 2000) = 2500, min(2500, 3000) = 2500
        { timeout: 12000, expected: 3000 },  // max(3000, 2000) = 3000, min(3000, 3000) = 3000
        { timeout: 20000, expected: 3000 },  // max(5000, 2000) = 5000, min(5000, 3000) = 3000
        { timeout: 30000, expected: 3000 },  // max(7500, 2000) = 7500, min(7500, 3000) = 3000
    ]

    for (const { timeout, expected } of testCases) {
        const calculated = Math.min(Math.max(timeout * 0.25, 2000), 3000)
        t.equal(calculated, expected,
            `timeout ${timeout}ms should have auto-finish delay of ${expected}ms`)
    }
})

test('Documentation: Show current vs proposed behavior', async (t) => {
    t.ok(true, 'CURRENT (BROKEN): autoFinishDelay = Math.floor(timeoutMs * 0.8)')
    t.ok(true, 'With -t 10000: delay = 8000ms, test gets only 2000ms (20%)')
    t.ok(true, '')
    t.ok(true, 'PROPOSED (FIX): autoFinishDelay = Math.min(Math.max(timeoutMs * 0.25, 2000), 3000)')
    t.ok(true, 'With -t 10000: delay = 2500ms, test gets 7500ms (75%)')
    t.ok(true, 'Benefits: 2-3s is enough to detect test completion, tests get most of the timeout')
})

async function bundleTestCode(testCode) {
    const result = await build({
        stdin: {
            contents: testCode,
            resolveDir: projectRoot,
            sourcefile: 'test.js',
            loader: 'js'
        },
        bundle: true,
        format: 'iife',
        platform: 'browser',
        write: false,
        external: [],
    })

    return result.outputFiles[0].text
}

function runCliWithInput(testCode, timeoutMs) {
    return new Promise((resolve) => {
        const child = spawn(
            'node',
            [cliPath, '--timeout', timeoutMs.toString()],
            {
                cwd: projectRoot,
                stdio: ['pipe', 'pipe', 'pipe']
            }
        )

        let stdout = ''
        let stderr = ''

        // Give extra time to observe the failure
        const testTimeout = setTimeout(() => {
            child.kill('SIGTERM')
            resolve({
                exitCode: null,
                stdout,
                stderr: stderr + `\nTest runner timed out after ${timeoutMs + 5000}ms`
            })
        }, timeoutMs + 5000)

        child.stdout.on('data', (data) => {
            stdout += data.toString()
        })

        child.stderr.on('data', (data) => {
            stderr += data.toString()
        })

        child.on('close', (exitCode) => {
            clearTimeout(testTimeout)
            resolve({ exitCode, stdout, stderr })
        })

        child.on('error', (error) => {
            clearTimeout(testTimeout)
            resolve({ exitCode: null, stdout, stderr: stderr + error.message })
        })

        child.stdin.write(testCode)
        child.stdin.end()
    })
}

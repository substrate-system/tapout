/**
 * Test for bug: tapout exits prematurely when waitFor times out
 *
 * THE BUG:
 * When a test uses waitFor() (or any async operation) to wait for an element
 * that never appears, the autofinish mechanism in test-runner.html sees
 * "no console output" and triggers early, setting window.testsFinished = true.
 *
 * This causes tapout to exit with code 0 (success) even though:
 * 1. The test never actually finished
 * 2. The waitFor should have timed out and thrown an error
 * 3. The exit code should be 1 (failure)
 *
 * EXPECTED BEHAVIOR:
 * - tapout should NOT exit until the test actually completes or times out
 * - If waitFor times out (throws an error), exit code should be 1
 * - autofinish should not trigger while a test is still awaiting async operations
 */

import { test } from '@substrate-system/tapzero'
import { spawn } from 'node:child_process'
import { build } from 'esbuild'
import path from 'node:path'

const projectRoot = process.cwd()
const cliPath = path.join(projectRoot, 'dist', 'cli.js')

test('Bug: waitFor never finds element, tapout exits prematurely with code 0', async (t) => {
    // This test simulates a scenario where:
    // 1. A test waits for an element that doesn't exist
    // 2. The waitFor has a 5 second timeout
    // 3. tapout has an 8 second timeout
    // 4. autofinish triggers after ~2-3 seconds of no output
    // 5. tapout exits with code 0 before waitFor can timeout and throw
    const testWithWaitFor = `
console.log('TAP version 13')
console.log('1..1')
console.log('# waiting for element that does not exist')

// Simulate waitFor - waits for element, times out after 5 seconds
async function waitFor(selector, timeout = 5000) {
    const start = Date.now()
    while (Date.now() - start < timeout) {
        const el = document.querySelector(selector)
        if (el) return el
        await new Promise(r => setTimeout(r, 100))
    }
    throw new Error('waitFor timed out: ' + selector)
}

// This test should FAIL because the element never appears
async function runTest() {
    try {
        const button = await waitFor('.button-that-does-not-exist', 5000)
        console.log('ok 1 - found button')
    } catch (err) {
        console.log('not ok 1 - ' + err.message)
        window.testsFailed = true
    }
    window.testsFinished = true
}

runTest()
`

    const bundledCode = await bundleTestCode(testWithWaitFor)
    const result = await runCliWithInput(bundledCode, 8000)

    // CURRENT BUG BEHAVIOR:
    // - autofinish triggers after ~2-3 seconds of no output
    // - tapout exits with code 0 (success!)
    // - The waitFor never gets a chance to timeout and report failure

    // EXPECTED BEHAVIOR:
    // - tapout waits for the full test to complete (including waitFor timeout)
    // - waitFor times out after 5 seconds and throws an error
    // - Test reports "not ok 1 - waitFor timed out"
    // - tapout exits with code 1 (failure)

    t.equal(result.exitCode, 1,
        'should exit with code 1 because waitFor timed out (currently exits with 0)')

    t.ok(
        result.stdout.includes('not ok') || result.stdout.includes('waitFor timed out'),
        'should report test failure from waitFor timeout'
    )
})

test('Bug: async test never completes, tapout should wait and report timeout', async (t) => {
    // A test with an async operation that never resolves
    // tapout should wait until its own timeout, then report failure
    const neverCompletesTest = `
console.log('TAP version 13')
console.log('1..1')
console.log('# test will never complete')

// This promise never resolves - simulating a broken async operation
async function runTest() {
    await new Promise(() => {}) // Never resolves
    console.log('ok 1 - this will never be reached')
    window.testsFinished = true
}

runTest()
`

    const bundledCode = await bundleTestCode(neverCompletesTest)

    // Use a 5 second timeout - test should wait the full 5 seconds
    // then exit with failure (timeout)
    const startTime = Date.now()
    const result = await runCliWithInput(bundledCode, 5000)
    const elapsed = Date.now() - startTime

    // CURRENT BUG BEHAVIOR:
    // - autofinish triggers after ~2-3 seconds of no output
    // - tapout exits with code 0 in about 2-3 seconds
    // - Test appears to pass even though it never completed

    // EXPECTED BEHAVIOR:
    // - tapout waits for its full timeout (5 seconds)
    // - Then exits with code 1 because tests didn't complete
    // - OR exits with timeout error

    t.ok(elapsed >= 4500,
        `should wait close to the full timeout (took ${elapsed}ms, expected >= 4500ms)`)

    t.equal(result.exitCode, 1,
        'should exit with code 1 for tests that never complete')
})

test('Bug: test with 3s waitFor and 8s tapout timeout should wait for waitFor', async (t) => {
    // Simpler case: waitFor takes 3 seconds, tapout timeout is 8 seconds
    // autofinish should NOT exit before waitFor completes
    const waitForTest = `
console.log('TAP version 13')
console.log('1..1')
console.log('# starting test with 3s waitFor')

async function waitFor(selector, timeout = 3000) {
    const start = Date.now()
    while (Date.now() - start < timeout) {
        const el = document.querySelector(selector)
        if (el) return el
        await new Promise(r => setTimeout(r, 100))
    }
    throw new Error('Element not found: ' + selector)
}

async function runTest() {
    try {
        // Wait 3 seconds for element that doesn't exist
        const el = await waitFor('.nonexistent', 3000)
        console.log('ok 1 - found element')
    } catch (err) {
        console.log('not ok 1 - ' + err.message)
        window.testsFailed = true
    }
    window.testsFinished = true
}

runTest()
`

    const bundledCode = await bundleTestCode(waitForTest)
    const startTime = Date.now()
    const result = await runCliWithInput(bundledCode, 8000)
    const elapsed = Date.now() - startTime

    // CURRENT BUG: autofinish triggers after ~2-3s, before waitFor can complete
    // EXPECTED: Wait at least 3 seconds for waitFor to timeout

    t.ok(elapsed >= 2900,
        `should wait for waitFor to complete (took ${elapsed}ms, expected >= 3000ms)`)

    t.ok(
        result.stdout.includes('not ok') || result.stdout.includes('Element not found'),
        'should show the waitFor failure message'
    )

    t.equal(result.exitCode, 1,
        'should exit with code 1 when waitFor fails')
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

        // Test timeout is longer than tapout timeout to capture all output
        const testTimeout = setTimeout(() => {
            child.kill('SIGTERM')
            resolve({
                exitCode: null,
                stdout,
                stderr: stderr + `\nTest harness timed out after ${timeoutMs + 5000}ms`
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

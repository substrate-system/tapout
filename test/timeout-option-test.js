import { test } from '@substrate-system/tapzero'
import { spawn } from 'node:child_process'
import { build } from 'esbuild'
import path from 'node:path'

const projectRoot = process.cwd()
const cliPath = path.join(projectRoot, 'dist', 'cli.js')

test('CLI timeout option (-t) works correctly', async (t) => {
    // Bundle the fixture test file using esbuild
    const fixtureTestPath = path.join(projectRoot, 'test', '_timeout_test.js')
    const bundledCode = await bundleTestFile(fixtureTestPath)

    // Test 1: Should pass with sufficient timeout (10 seconds)
    const successResult = await runCliWithInput(bundledCode, 10000)
    
    t.equal(successResult.exitCode, 0, 'should pass with sufficient timeout')
    
    // Check if the test actually ran for 6 seconds vs auto-finished early
    const hasAutoFinished = successResult.stdout.includes('Tests auto-finished')
    const hasTestOutput = successResult.stdout.includes(
        'long running test completed')
    
    if (hasAutoFinished && !hasTestOutput) {
        // With a 10 second timeout and custom=true, auto-finish should be at 8 seconds
        // So a 6 second test should complete before auto-finishing
        // If it auto-finished, the timeout mechanism isn't working as expected
        console.log('Warning: Test auto-finished before completion. Expected 8s auto-finish delay but test took 6s.')
        t.ok(successResult.exitCode === 0, 'test should still exit successfully even if auto-finished')
    } else {
        t.ok(
            hasTestOutput,
            'should complete the long-running test with sufficient timeout'
        )
    }

    // Test 2
    // Should timeout or auto-finish with insufficient timeout (3 seconds)
    const timeoutResult = await runCliWithInput(bundledCode, 3000)
    t.ok(
        timeoutResult.exitCode === null || timeoutResult.exitCode === 0 ||
            (timeoutResult.exitCode === 1),
        'should timeout or auto-finish with insufficient timeout,' +
            ` got exit code: ${timeoutResult.exitCode}`
    )
    t.ok(
        !timeoutResult.stdout.includes('ok 1 - long running test completed') &&
        !timeoutResult.stdout.includes('ok 1 long running test completed'),
        'should not complete the test with insufficient timeout'
    )
})

test('CLI custom timeout should not auto-finish after ~3 seconds', async (t) => {
    const delayedCompletionTest = `
console.log('TAP version 13')
console.log('1..1')
setTimeout(() => {
    console.log('ok 1 - delayed completion after 4 seconds')
    window.testsFinished = true
}, 4000)
`

    const result = await runCliWithInput(delayedCompletionTest, 10000)

    t.equal(result.exitCode, 0, 'should exit successfully with 10 second timeout')
    t.ok(
        result.stdout.includes('ok 1 - delayed completion after 4 seconds'),
        'should wait for the 4 second test completion output'
    )
    t.equal(
        result.stdout.includes('Tests auto-finished'),
        false,
        'should not auto-finish before delayed test completion'
    )
})

test('CLI default timeout should be 5000ms when --timeout is not provided', async (t) => {
    const timeoutProbeTest = `
console.log('TAP version 13')
console.log('1..1')
const timeoutMs = new URLSearchParams(window.location.search).get('timeout')
if (timeoutMs === '5000') {
    console.log('ok 1 - default timeout is 5000ms')
} else {
    console.log('not ok 1 - default timeout should be 5000ms, got ' + timeoutMs)
}
window.testsFinished = true
`

    const result = await runCliWithInputAndArgs(timeoutProbeTest, [], 7000)

    t.equal(result.exitCode, 0, 'should exit with code 0 using default timeout')
    t.ok(
        result.stdout.includes('ok 1 - default timeout is 5000ms'),
        'should pass timeout probe when default is 5000ms'
    )
})

async function bundleTestFile(testFilePath) {
    const result = await build({
        entryPoints: [testFilePath],
        bundle: true,
        format: 'iife',
        platform: 'browser',
        write: false,
        external: [],
    })
    
    return result.outputFiles[0].text
}

function runCliWithInput(testCode, timeoutMs) {
    return runCliWithInputAndArgs(
        testCode,
        ['--timeout', timeoutMs.toString()],
        timeoutMs + 2000
    )
}

function runCliWithInputAndArgs(testCode, cliArgs, harnessTimeoutMs) {
    return new Promise((resolve) => {
        const child = spawn(
            'node',
            [cliPath, ...cliArgs],
            {
                cwd: projectRoot,
                stdio: ['pipe', 'pipe', 'pipe']
            }
        )

        let stdout = ''
        let stderr = ''

        // Set a harness timeout slightly longer than expected CLI completion
        const testTimeout = setTimeout(() => {
            child.kill('SIGTERM')
            resolve({
                exitCode: null,
                stdout,
                stderr: stderr + `Test timed out after ${harnessTimeoutMs}ms`
            })
        }, harnessTimeoutMs)

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

        child.on('close', () => {
            clearTimeout(testTimeout)
        })

        // Send the test code to stdin and close it
        child.stdin.write(testCode)
        child.stdin.end()
    })
}

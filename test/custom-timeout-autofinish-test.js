import { test } from '@substrate-system/tapzero'
import { spawn } from 'node:child_process'
import { build } from 'esbuild'
import path from 'node:path'

const projectRoot = process.cwd()
const cliPath = path.join(projectRoot, 'dist', 'cli.js')

test('Custom timeout auto-finish delay should not exceed timeout', async (t) => {
    // Create a test that runs for 2 seconds
    // With a 10s timeout, current code uses 80% (8 seconds) for auto-finish
    // Total time: 2s (test) + 8s (auto-finish) = 10s = timeout exactly
    // This causes page.waitForFunction to timeout before
    // window.testsFinished is set

    const quickTest = `
import { test } from '@substrate-system/tapzero'

test('quick test', (t) => {
    return new Promise(resolve => {
        setTimeout(() => {
            t.ok(true, 'test completed after 2 seconds')
            // Don't explicitly set window.testsFinished
            // Let auto-finish handle it
            resolve()
        }, 2000)
    })
})
`

    const bundledCode = await bundleTestCode(quickTest)

    // Use a 10 second timeout
    // Expected behavior: Test should complete successfully
    // Current behavior: Times out because auto-finish delay (8s) +
    // test time (2s) ≥ timeout (10s)
    const result = await runCliWithInput(bundledCode, 10000)

    // The test should pass, not timeout
    t.equal(result.exitCode, 0, 'should exit successfully with code 0')

    // Should not see timeout error
    t.equal(
        result.stderr.includes('Tests timed out'),
        false,
        'should not timeout when test completes before timeout'
    )

    // Should see test completion
    t.ok(
        (result.stdout.includes('ok 1') ||
        result.stdout.includes('test completed')),
        'should show test completion'
    )

    // Should see auto-finish message
    t.ok(
        result.stdout.includes('Tests auto-finished'),
        'should auto-finish after test completes'
    )
})

test('Auto-finish delay should be reasonable for custom timeouts', async (t) => {
    // Create a test that runs for 3 seconds
    // With a 12 second timeout, current code uses 80% (9.6s) for auto-finish
    // Total time: 3s (test) + 9.6s (auto-finish) = 12.6s > timeout
    // This should fail with the current implementation

    const slowTest = `
import { test } from '@substrate-system/tapzero'

test('slow test', (t) => {
    return new Promise(resolve => {
        setTimeout(() => {
            t.ok(true, 'test completed after 3 seconds')
            resolve()
        }, 3000)
    })
})
`

    const bundledCode = await bundleTestCode(slowTest)

    // Use a 12 second timeout
    const result = await runCliWithInput(bundledCode, 12000)

    // Should pass, but currently fails due to excessive auto-finish delay
    t.equal(result.exitCode, 0, 'should exit successfully')

    t.equal(
        result.stderr.includes('Tests timed out'),
        false,
        'should not timeout - auto-finish delay should be reasonable (max 3s, ' +
            'not 80% of timeout)'
    )
})

test('Auto-finish delay should leave room for tests to run', async (t) => {
    // The issue: with -t 10000, autoFinishDelay is 8000ms (80%)
    // This means tests only get 2000ms (20%) before auto-finish kicks in
    // But tests might legitimately take longer than 20% of the timeout

    const mediumTest = `
import { test } from '@substrate-system/tapzero'

test('medium duration test', (t) => {
    // This test takes 4 seconds
    // With 10 second timeout, it should easily complete
    // But current implementation: 4s test + 8s auto-finish > 10s timeout
    return new Promise(resolve => {
        setTimeout(() => {
            t.ok(true, 'test completed after 4 seconds')
            resolve()
        }, 4000)
    })
})
`

    const bundledCode = await bundleTestCode(mediumTest)

    // Use a 10 second timeout
    const result = await runCliWithInput(bundledCode, 10000)

    t.equal(result.exitCode, 0, 'should complete successfully')

    // The fix should use max(timeout * 0.25, 2000, 3000)
    // For 10s timeout: min(max(2500, 2000), 3000) = 3000ms
    // This gives tests 7 seconds to run, auto-finish waits 3 seconds
    // Total: at most 10 seconds
    t.equal(
        result.stderr.includes('Tests timed out'),
        false,
        'should not timeout when auto-finish delay is reasonable (3s max)'
    )

    t.ok(
        result.stdout.includes('ok') || result.stdout.includes('TAP version'),
        'should show test output'
    )
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

        // Set a test timeout slightly longer than the CLI timeout
        // Add extra time to observe the failure
        const testTimeout = setTimeout(() => {
            child.kill('SIGTERM')
            resolve({
                exitCode: null,
                stdout,
                stderr: stderr + `\nTest timed out after ${timeoutMs + 5000}ms`
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

        // Send the test code to stdin and close it
        child.stdin.write(testCode)
        child.stdin.end()
    })
}

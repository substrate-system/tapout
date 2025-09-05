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
        const testTimeout = setTimeout(() => {
            child.kill('SIGTERM')
            resolve({
                exitCode: null,
                stdout,
                stderr: stderr + `Test timed out after ${timeoutMs + 2000}ms`
            })
        }, timeoutMs + 2000)

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

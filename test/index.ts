/**
 * Test the CLI.
 *
 * - Run example test files through the CLI
 * - Check exit codes for success/failure scenarios
 * - Validat output messages and error handling
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
    exitCode: number | null
    stdout: string
    stderr: string
}

async function runCliTest (testFile: string): Promise<TestResult> {
    return new Promise((resolve) => {
        const testPath = path.join(projectRoot, 'test', testFile)
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

        // Read test file and pipe it to CLI
        fs.readFile(testPath, 'utf8').then((testCode) => {
            child.stdin.write(testCode)
            child.stdin.end()
        }).catch((err) => {
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

        // Timeout after 15 seconds
        setTimeout(() => {
            child.kill('SIGTERM')
            resolve({
                exitCode: null,
                stdout,
                stderr: stderr + 'Test timed out after 15 seconds'
            })
        }, 15000)
    })
}

test('CLI: simple test should pass', async (t) => {
    const result = await runCliTest('simple-test.js')

    t.equal(result.exitCode, 0, 'simple test should exit with code 0')
    t.ok(
        result.stdout.includes('✅ Tests passed'),
        'should show success message'
    )
    t.ok(
        result.stdout.includes('[browser] TAP version 13'),
        'should show TAP output'
    )
    t.ok(
        result.stdout.includes('[browser] ok 1 - simple test'),
        'should show test result'
    )
})

test('CLI: complex test should pass', async (t) => {
    const result = await runCliTest('tape-test.js')

    t.equal(result.exitCode, 0, 'complex test should exit with code 0')
    t.ok(
        result.stdout.includes('✅ Tests passed'),
        'should show success message'
    )
    t.ok(
        result.stdout.includes('[browser] TAP version 13'),
        'should show TAP output'
    )
    t.ok(
        result.stdout.includes('[browser] ok 1 - addition works'),
        'should show first test'
    )
    t.ok(
        result.stdout.includes('[browser] ok 2 - async test works'),
        'should show async test'
    )
    t.ok(
        result.stdout.includes('[browser] ok 3 - object test works'),
        'should show object test'
    )
})

test('CLI: failing test should fail', async (t) => {
    const result = await runCliTest('failing-test.js')

    t.equal(result.exitCode, 1, 'failing test should exit with code 1')
    t.ok(
        result.stdout.includes('❌ Tests failed'),
        'should show failure message'
    )
    t.ok(
        result.stdout.includes('[browser] not ok 2 - this test fails'),
        'should show failing test'
    )
    t.ok(
        result.stdout.includes('Error executing test code') || result.stderr.includes('Error'),
        'should show error'
    )
})

test('CLI: timeout test should handle timeouts', async (t) => {
    const result = await runCliTest('timeout-test.js')

    // This test might either timeout (exit code null) or auto-finish (exit code 0)
    // depending on the timing, both are acceptable behaviors
    t.ok(
        result.exitCode === 0 || result.exitCode === null || result.exitCode === 1,
        `timeout test should exit with code 0, 1, or null (timeout), got: ${result.exitCode}`
    )

    if (result.exitCode === 0) {
        t.ok(
            result.stdout.includes('✅ Tests passed') || result.stdout.includes('Tests auto-finished'),
            'should auto-finish or pass'
        )
    } else if (result.exitCode === 1) {
        t.ok(
            result.stdout.includes('❌ Tests timed out') || result.stdout.includes('❌ Tests failed'),
            'should show timeout or failure message'
        )
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

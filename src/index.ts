import { chromium } from 'playwright'
import { createServer } from 'http-server'
import path from 'path'
import { fileURLToPath } from 'url'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function readStdin (): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = ''

        process.stdin.setEncoding('utf8')
        process.stdin.on('data', chunk => {
            data += chunk
        })

        process.stdin.on('end', () => {
            resolve(data)
        })

        process.stdin.on('error', reject)
    })
}

export async function runTestsInBrowser (testCode: string, options: { timeout?: number } = {}): Promise<void> {
    const PORT = 8123
    const timeout = options.timeout || 10000
    const tempDir = await fs.mkdtemp(path.join(tmpdir(), 'tapout-'))

    try {
        // Create the test bundle
        const bundlePath = path.join(tempDir, 'test-bundle.js')
        await fs.writeFile(bundlePath, testCode)

        // Create test runner HTML
        const htmlPath = path.join(tempDir, 'test-runner.html')
        const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Test Runner</title>
  </head>
  <body>
    <script type="module">
      // Set up test completion detection
      let hasFinished = false
      let finishTimer = null
      
      function markTestsFinished() {
        if (!hasFinished) {
          hasFinished = true
          window.testsFinished = true
        }
      }
      
      // Auto-finish tests after a short delay if no explicit completion
      function resetFinishTimer() {
        if (finishTimer) clearTimeout(finishTimer)
        finishTimer = setTimeout(() => {
          if (!hasFinished && !window.testsFinished) {
            console.log('Tests auto-finished (no explicit completion detected)')
            markTestsFinished()
          }
        }, 1000)
      }
      
      // Override console methods to detect test completion
      const originalConsole = { ...console }
      let lastLogTime = Date.now()
      
      console.log = function(...args) {
        originalConsole.log(...args)
        lastLogTime = Date.now()
        // Only reset timer if we haven't seen logs for a while
        if (!hasFinished) {
          if (finishTimer) clearTimeout(finishTimer)
          finishTimer = setTimeout(() => {
            if (!hasFinished && !window.testsFinished && (Date.now() - lastLogTime) > 500) {
              console.log('Tests auto-finished (no explicit completion detected)')
              markTestsFinished()
            }
          }, 1000)
        }
      }
      console.error = function(...args) {
        originalConsole.error(...args)
        lastLogTime = Date.now()
      }
      
      // Common test completion patterns
      window.addEventListener('load', () => {
        resetFinishTimer()
      })
      
      // Handle unhandled errors
      window.addEventListener('error', (event) => {
        console.error('Unhandled error:', event.error)
        window.testsFailed = true
        markTestsFinished()
      })
      
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason)
        window.testsFailed = true
        markTestsFinished()
      })
      
      try {
        // Inject the test code
        ${testCode}
        
        // Final fallback - mark as finished after code execution
        resetFinishTimer()
      } catch (error) {
        console.error('Error executing test code:', error)
        window.testsFailed = true
        markTestsFinished()
      }
    </script>
  </body>
</html>`

        await fs.writeFile(htmlPath, htmlContent)

        // Serve static test files
        const server = createServer({ root: tempDir })
        server.listen(PORT)

        const browser = await chromium.launch()
        const page = await browser.newPage()

        let hasErrors = false

        page.on('console', msg => {
            const text = msg.text()
            console[msg.type()](`[browser] ${text}`)

            // Detect TAP failures, errors, and specific failure patterns
            if (text.startsWith('not ok') ||
                text.includes('Error:') ||
                text.includes('Failed') ||
                text.includes('FAIL') ||
                msg.type() === 'error') {
                hasErrors = true
            }
        })

        page.on('pageerror', error => {
            console.error(`[browser] Page error: ${error.message}`)
            hasErrors = true
        })

        try {
            await page.goto(`http://localhost:${PORT}/test-runner.html`)

            try {
                // @ts-expect-error this runs in a browser
                await page.waitForFunction(() => window.testsFinished === true, null, {
                    timeout
                })

                // @ts-expect-error this runs in a browser
                const testsFailed = await page.evaluate(() => window.testsFailed)

                if (hasErrors || testsFailed) {
                    console.log('❌ Tests failed.')
                    throw new Error('Tests failed')
                } else {
                    console.log('✅ Tests passed in a browser.')
                }
            } catch (timeoutError: any) {
                if (timeoutError.message && timeoutError.message.includes('Timeout')) {
                    console.log('❌ Tests timed out.')
                    throw new Error('Tests timed out')
                } else {
                    throw timeoutError
                }
            }
        } finally {
            await browser.close()
            server.close()
        }
    } finally {
        // Clean up temp directory
        await fs.rm(tempDir, { recursive: true, force: true })
    }
}

export function example (): void {
    console.log('Example function')
}

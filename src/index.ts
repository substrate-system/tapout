import { chromium, firefox, webkit, type BrowserType } from 'playwright'
import { createServer } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { promises as fs } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export type SupportedBrowser = 'chromium' | 'firefox' | 'webkit'

const browsers: Record<SupportedBrowser, BrowserType> = {
    chromium,
    firefox,
    webkit
}

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

export async function runTestsInBrowser (testCode: string, options: { timeout?: number; browser?: SupportedBrowser } = {}): Promise<void> {
    const PORT = 8123
    const timeout = options.timeout || 10000
    const browserType = options.browser || 'chromium'

    // Custom server to serve static files and dynamic test code
    const server = createServer(async (req, res) => {
        const url = new URL(req.url || '/', `http://localhost:${PORT}`)
        const pathname = url.pathname

        try {
            if (pathname === '/' || pathname === '/test-runner.html') {
                // Serve the static HTML file
                const htmlPath = path.join(__dirname, 'test-runner.html')
                const htmlContent = await fs.readFile(htmlPath, 'utf8')
                res.writeHead(200, { 'Content-Type': 'text/html' })
                res.end(htmlContent)
            } else if (pathname === '/test-bundle.js') {
                // Serve the dynamic test code
                res.writeHead(200, { 'Content-Type': 'application/javascript' })
                res.end(testCode)
            } else {
                // 404 for other paths
                res.writeHead(404)
                res.end('Not Found')
            }
        } catch (_error) {
            res.writeHead(500)
            res.end('Server Error')
        }
    })

    try {
        server.listen(PORT)

        const browser = await browsers[browserType].launch()
        const page = await browser.newPage()

        let hasErrors = false

        page.on('console', msg => {
            const text = msg.text()
            console[msg.type()](text)

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
            console.error(`Page error: ${error.message}`)
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
                    throw new Error('Tests failed')
                } else {
                    // Tests passed - no additional output needed for TAP format
                }
            } catch (timeoutError: any) {
                if (timeoutError.message && timeoutError.message.includes('Timeout')) {
                    throw new Error('Tests timed out')
                } else {
                    throw timeoutError
                }
            }
        } finally {
            await browser.close()
            server.close()
        }
    } catch (error) {
        server.close()
        throw error
    }
}

export function example (): void {
    console.log('Example function')
}

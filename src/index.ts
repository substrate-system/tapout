import { chromium, firefox, webkit, type BrowserType } from 'playwright'
import { createServer } from 'node:http'
import path from 'path'
import { fileURLToPath } from 'url'
import { promises as fs } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export type SupportedBrowser = 'chromium'|'firefox'|'webkit'|'edge'

const browsers: Record<SupportedBrowser, BrowserType> = {
    chromium,
    firefox,
    webkit,
    edge: chromium // Edge uses Chromium engine
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

export async function runTestsInBrowser (
    testCode:string,
    options:{
        timeout?:number;
        customTimeout?:boolean;
        browser?:SupportedBrowser;
    } = {}
):Promise<void> {
    const PORT = 8123
    const timeout = options.timeout || 10000
    const customTimeout = options.customTimeout || false
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
                // Serve the test code
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

        const browserOptions = browserType === 'edge'
            ? { channel: 'msedge' as const }
            : {}

        const browser = (await (browsers[browserType === 'edge' ?
            'chromium' :
            browserType]).launch(browserOptions))
        const page = await browser.newPage()
        const browserName = (browserType === 'edge' ?
            'edge' :
            browser.browserType().name())

        // TAP comment -- which browser is being used
        console.log(`# Running tests in ${browserName}`)

        let hasErrors = false

        page.on('console', msg => {
            const text = msg.text()
            console[msg.type()](text)

            // TAP failures, errors, specific failure patterns
            // But ignore common browser resource loading messages
            if (
                text.startsWith('not ok') ||
                (
                    text.includes('Error:') &&
                    !text.includes('Failed to load resource')
                ) ||
                (
                    text.includes('Failed') &&
                    !text.includes('Failed to load resource')
                ) ||
                text.includes('FAIL') ||
                (
                    msg.type() === 'error' &&
                    !text.includes('Failed to load resource')
                )
            ) {
                hasErrors = true
            }
        })

        page.on('pageerror', error => {
            console.error(`Page error: ${error.message}`)
            hasErrors = true
        })

        try {
            await page.goto(`http://localhost:${PORT}/test-runner.html?timeout=${timeout}&custom=${customTimeout}`)

            try {
                await page.waitForFunction(
                    // @ts-expect-error this runs in a browser
                    () => window.testsFinished === true,
                    null,
                    {
                        timeout
                    }
                )

                // @ts-expect-error this runs in a browser
                const testsFailed = await page.evaluate(() => window.testsFailed)

                if (hasErrors || testsFailed) {
                    throw new Error('Tests failed')
                } else {
                    // Tests passed - no additional output needed for TAP format
                }
            } catch (timeoutError: any) {
                if (
                    timeoutError.message &&
                    timeoutError.message.includes('Timeout')
                ) {
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

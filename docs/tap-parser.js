/* TAP Parser - Parses TAP (Test Anything Protocol) output */

class TAPParser {
    static parse (tapOutput) {
        const lines = tapOutput.trim().split('\n')
        const result = {
            version: null,
            plan: null,
            tests: [],
            comments: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                todo: 0
            },
            browser: null,
            startTime: new Date(),
            endTime: new Date(),
            duration: 0
        }

        for (const line of lines) {
            const trimmedLine = line.trim()

            // Parse TAP version
            if (trimmedLine.startsWith('TAP version')) {
                result.version = trimmedLine.replace('TAP version ', '')
                continue
            }

            // Parse test plan
            if (/^\d+\.\.\d+$/.test(trimmedLine)) {
                const match = trimmedLine.match(/^(\d+)\.\.(\d+)$/)
                if (match) {
                    result.plan = {
                        start: parseInt(match[1]),
                        end: parseInt(match[2])
                    }
                    result.summary.total = result.plan.end - result.plan.start + 1
                }
                continue
            }

            // Parse test results
            if (trimmedLine.startsWith('ok ') || trimmedLine.startsWith('not ok ')) {
                const test = this.parseTestLine(trimmedLine)
                result.tests.push(test)

                // Update summary
                switch (test.status) {
                    case 'passed':
                        result.summary.passed++
                        break
                    case 'failed':
                        result.summary.failed++
                        break
                    case 'skipped':
                        result.summary.skipped++
                        break
                    case 'todo':
                        result.summary.todo++
                        break
                }
                continue
            }

            // Parse comments (including browser info)
            if (trimmedLine.startsWith('#')) {
                const comment = trimmedLine.substring(1).trim()
                result.comments.push(comment)

                // Extract browser info
                if (comment.startsWith('Running tests in ')) {
                    result.browser = comment.replace('Running tests in ', '')
                }
                continue
            }

            // Parse diagnostic information
            if (trimmedLine.startsWith('  ')) {
                // This is likely diagnostic info for the previous test
                if (result.tests.length > 0) {
                    const lastTest = result.tests[result.tests.length - 1]
                    if (!lastTest.diagnostic) {
                        lastTest.diagnostic = []
                    }
                    lastTest.diagnostic.push(trimmedLine.trim())
                }
            }
        }

        // Calculate duration (mock for now)
        result.duration = Math.floor(Math.random() * 2000) + 500 // 500-2500ms

        return result
    }

    static parseTestLine (line) {
        const test = {
            number: null,
            description: '',
            status: 'passed',
            directive: null,
            reason: null,
            diagnostic: []
        }

        // Determine if test passed or failed
        test.status = line.startsWith('ok ') ? 'passed' : 'failed'

        // Remove "ok " or "not ok " prefix
        let remaining = line.replace(/^(not )?ok /, '')

        // Extract test number
        const numberMatch = remaining.match(/^(\d+)\s*/)
        if (numberMatch) {
            test.number = parseInt(numberMatch[1])
            remaining = remaining.substring(numberMatch[0].length)
        }

        // Check for directives (SKIP, TODO)
        const directiveMatch = remaining.match(/^(.+?)\s*#\s*(SKIP|TODO)(\s+(.+))?$/i)
        if (directiveMatch) {
            test.description = directiveMatch[1].trim()
            test.directive = directiveMatch[2].toUpperCase()
            test.reason = directiveMatch[4] || ''

            if (test.directive === 'SKIP') {
                test.status = 'skipped'
            } else if (test.directive === 'TODO') {
                test.status = 'todo'
            }
        } else {
            // Extract description
            test.description = remaining.replace(/^\s*-?\s*/, '').trim()
        }

        return test
    }
}

// Make it available globally
window.TAPParser = TAPParser

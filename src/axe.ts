import type { Test } from '@substrate-system/tapzero'
import axe from 'axe-core'

type WcagOpts = {
    context:axe.ElementContext
    tags:string[];
    rules:axe.RunOptions['rules'];
    runOnly:axe.RunOptions['runOnly'];
}

/**
 * Run axe accessibility scan and assert no violations
 *
 * @param t - Tapzero tester
 * @param {Partial<{ context, tags, rules, runOnly }>} [options] Options object
 * @param {string} [message] Optional message
 */
export async function assertNoViolations (
    t:Test,
    options:Partial<WcagOpts> = {},
    message:string = 'should have no accessibility violations'
) {
    const {
        context = document,
        tags = ['wcag2a', 'wcag2aa'],
        rules = {},
        runOnly
    } = options

    const axeOptions: axe.RunOptions = { rules }

    // Use provided runOnly, or default to tag-based
    if (runOnly) {
        axeOptions.runOnly = runOnly
    } else {
        axeOptions.runOnly = { type: 'tag', values: tags }
    }

    const results = await axe.run(context, axeOptions)

    t.equal(results.violations.length, 0, message)

    // Log violations for debugging
    if (results.violations.length > 0) {
        console.error('\n=== Accessibility Violations ===')
        results.violations.forEach((violation, index) => {
            console.error(`\n${index + 1}. ${violation.help}`)
            console.error(`   Impact: ${violation.impact}`)
            console.error(`   WCAG: ${violation.tags
                .filter(tag => tag.startsWith('wcag')).join(', ')}`)
            console.error(`   Affected elements: ${violation.nodes.length}`)
            violation.nodes.forEach((node, nodeIndex) => {
                console.error(`     ${nodeIndex + 1}. ${node.html}`)
                console.error(`        ${node.failureSummary}`)
            })
        })
        console.error('\n================================\n')
    }

    return results
}

/**
 * Check WCAG compliance level
 *
 * @param t - Tapzero tester
 * @param level - WCAG level ('A', 'AA', 'AAA') or tag name(s),
 *                like 'wcag2a', ['wcag2a', 'wcag2aa']; default is 'AA'
 * @param options - Additional options to pass to assertNoViolations
 */
export async function assertWCAGCompliance (
    t:Test,
    level:string|string[] = 'AA',
    options:Partial<WcagOpts> = {}
) {
    const levelMap = {
        A: ['wcag2a'],
        AA: ['wcag2a', 'wcag2aa'],
        AAA: ['wcag2a', 'wcag2aa', 'wcag2aaa']
    }

    // If level is an array, use it directly as tags
    let tags:string[]
    if (Array.isArray(level)) {
        tags = level
    } else if (levelMap[level]) {
        // If it's a letter level (A, AA, AAA), convert to tags
        tags = levelMap[level]
    } else {
        // Otherwise treat it as a tag name directly
        tags = [level]
    }

    const levels = Array.isArray(level) ? level.join(', ') : level

    return assertNoViolations(t, {
        ...options,
        tags
    }, `should meet WCAG ${levels} compliance`)
}

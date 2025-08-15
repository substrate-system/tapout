// @ts-check
import { defineConfig, devices } from '@playwright/test'
/**
 * Read environment variables from file.
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './tests',
    fullyParallel: true,  /* Run tests in files in parallel */
    /* Fail the build on CI if you accidentally left test.only in
    the source code. */
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,  /* Retry on CI only */
    workers: process.env.CI ? 1 : undefined,  /* Opt out of parallel tests on CI. */
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',
    /* Shared settings for all the projects below.
    See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        // baseURL: 'http://localhost:3000',

        /* Collect trace when retrying the failed test.
        See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                permissions: ['clipboard-read']
            },
        },

        {
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox'],
                permissions: ['clipboard-read']
            },
        },

        {
            name: 'webkit',
            use: {
                ...devices['Desktop Safari'],
                permissions: ['clipboard-read']
            },
        },

        /* Test against mobile viewports. */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
    ],

    /* Run your local dev server before starting the tests */
    // webServer: {
    //   command: 'npm run start',
    //   url: 'http://localhost:3000',
    //   reuseExistingServer: !process.env.CI,
    // },
})

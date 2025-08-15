# tapout
[![tests](https://img.shields.io/github/actions/workflow/status/substrate-system/tapout/nodejs.yml?style=flat-square)](https://github.com/substrate-system/tapout/actions/workflows/nodejs.yml)
[![types](https://img.shields.io/npm/types/@substrate-system/tapout?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![install size](https://flat.badgen.net/packagephobia/install/@substrate-system/tapout)](https://packagephobia.com/result?p=@substrate-system/tapout)
[![license](https://img.shields.io/badge/license-Big_Time-blue?style=flat-square)](LICENSE)


The easiest way to run tests in a browser from the command line.
Just pipe some JS into this command. A spiritual successor
to [tape-run](https://github.com/tape-testing/tape-run).

This uses [playwright](https://playwright.dev/) under the hood.

```
Usage: tapout [options]
            
Options:
  -t, --timeout <ms>    Timeout in milliseconds (default: 10000)
  -b, --browser <name>  Browser to use: chromium, firefox, webkit, edge (default: chromium)
  -r, --reporter <name> Output format: tap, html (default: tap)
  --outdir <path>       Output directory for HTML reports (default: current directory)
  --outfile <name>      Output filename for HTML reports (default: index.html)
  -h, --help           Show this help message

Examples:
  cat test.js | tapout --timeout 5000
  cat test.js | tapout --browser firefox
  cat test.js | tapout -b webkit -t 3000
  cat test.js | tapout --browser edge
  cat test.js | tapout --reporter html
  cat test.js | tapout --reporter html --outdir ./reports
  cat test.js | tapout --reporter html --outfile my-test-results.html
```

<details><summary><h2>Contents</h2></summary>

<!-- toc -->

- [Features](#features)
- [Install](#install)
- [Use](#use)
  * [Generate HTML reports](#generate-html-reports)
  * [`-b`, `--browser`](#-b---browser)
  * [`-t`, `--timeout`](#-t---timeout)
  * [`-r`, `--reporter`](#-r---reporter)
- [Error Handling & Detection](#error-handling--detection)
  * [Automatic Error Detection](#automatic-error-detection)
  * [Example Error Scenarios](#example-error-scenarios)
- [Example Tests](#example-tests)
  * [Tests](#tests)

<!-- tocstop -->

</details>

## Features

- **Cross-browser testing**: Run tests in Chrome, Firefox, Safari (WebKit), or Edge
- **Smart timeout handling**: Respects custom timeouts with intelligent
  auto-finish behavior
- **Comprehensive error detection**: Automatically catches unhandled promise
  rejections, uncaught exceptions, and console errors
- **Beautiful HTML reports**: Generate responsive HTML reports perfect for
  CI/CD or sharing
- **TAP compatible**: Standard TAP output works with any TAP formatter
- **Zero configuration**: Just pipe your JavaScript and go
- **CI/CD friendly**: Proper exit codes and error detection for
  automated testing

## Install

```sh
npm i -D @substrate-system/tapout
```

## Use

Pipe some Javascript to this command.

```sh
cat ./test/index.js | npx tapout
```

Use shell redirection

```sh
cat ./test/index.js | npx tapout | npx tap-spec
```

### Generate HTML reports

By default writes to `stdout`.

```sh
cat ./test/index.js | npx tapout --reporter html > index.html
open index.html  # View the generated report
```

#### HTML Summary

* `--reporter html` with no other options -> output HTML to stdout
* `--reporter html --outfile filename.html` -> save to `filename.html` in
  current directory
* `--reporter html --outdir ./reports` -> save to `./reports/index.html`
* `--reporter html --outdir ./reports --outfile custom.html` -> save to
  `./reports/custom.html`


### `-b`, `--browser`

Pass in the name of a browser to use. Default is Chrome.

Possibilities are `chromium`, `firefox`, `webkit`, or `edge`.

### `-t`, `--timeout`

Pass in a different timeout value. The default is 10 seconds.

The timeout respects the auto-finish behavior:
- With **default timeout** (no `-t` flag): Auto-finish triggers after a short delay (1-2 seconds) when no test activity is detected
- With **custom timeout** (using `-t`): Auto-finish uses 80% of the specified timeout, giving tests more time to complete naturally

```sh
cat test.js | npx tapout --timeout 5000
```

**Error Detection**: tapout automatically detects and reports test failures from:
- Unhandled promise rejections
- Uncaught exceptions  
- Console error messages with common error patterns
- TAP "not ok" results

Tests will exit with code 1 if any errors are detected, making it perfect for CI/CD pipelines.

### `-r`, `--reporter`

Choose the output format. Default is TAP.

**Available reporters:**
- `tap` - TAP output (default) - Standard Test Anything Protocol format
- `html` - Generate an HTML report file with beautiful, responsive design

```sh
# Generate HTML report
cat test.js | npx tapout --reporter html

# Generate HTML and output to stdout
cat test.js | npx tapout --reporter html > my-report.html

# Use TAP output (default)
cat test.js | npx tapout

# Customize output location
cat test.js | npx tapout --reporter html --outdir ./reports
cat test.js | npx tapout --reporter html --outfile my-test-results.html
cat test.js | npx tapout --reporter html --outdir ./reports --outfile custom-report.html
```

The HTML reporter generates an `index.html` file by default with:
- Beautiful, responsive design
- Test summary with pass/fail counts and percentages
- Individual test results with status indicators
- Browser and timing information
- Perfect for CI/CD or sharing results

**Output Control:**
- `--outdir <path>` - Specify where to save the HTML report
  (default: current directory)
- `--outfile <name>` - Specify the filename for the HTML report
  (default: index.html)
- If neither `--outdir` nor `--outfile` is specified, HTML output is sent
  to stdout

**GitHub Pages Integration:**
The generated HTML file is self-contained and can be easily hosted on GitHub
Pages or any static hosting service. Simply commit the HTML file to
your repository.

```sh
# Example CI workflow
npm test 2>&1 | npx tapout --reporter html --outfile test-results.html
git add test-results.html
git commit -m "Update test results"
git push
```

## Example Tests

Write tests for the browser environment:

```js
// test/index.ts
import { test } from '@substrate-system/tapzero'

test('example', t => {
    t.ok(document.body, 'should find a body tag')
})
```

Run the tests on the command line.

```sh
npx esbuild ./test/index.ts | npx tapout
```


### Tests

See the [`test/` directory](./test/).

```bash
npm run test:simple     # Basic passing test
npm run test:complex    # Complex async test  
npm run test:failing    # Failing test (exits with code 1)
npm run test:timeout    # Test timeout behavior
npm run test:all-examples  # Run passing examples

# HTML reporter examples  
npm run test:simple -- --reporter html     # Generate HTML report
npm run test:complex -- --reporter html    # Complex test HTML report
```

All tests:

```sh
npm test
```

# tapout
[![tests](https://img.shields.io/github/actions/workflow/status/substrate-system/tapout/nodejs.yml?style=flat-square)](https://github.com/substrate-system/tapout/actions/workflows/nodejs.yml)
[![types](https://img.shields.io/npm/types/@substrate-system/tapout?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![install size](https://flat.badgen.net/packagephobia/install/@substrate-system/tapout)](https://packagephobia.com/result?p=@substrate-system/tapout)
[![license](https://img.shields.io/badge/license-Big_Time-blue?style=flat-square)](LICENSE)


The easiest way to run tests in a browser from the command line. A
spiritual successor to [tape-run](https://github.com/tape-testing/tape-run).

This uses [playwright](https://playwright.dev/) under the hood.

```
Usage: tapout [options]
            
Options:
  -t, --timeout <ms>    Timeout in milliseconds (default: 10000)
  -b, --browser <name>  Browser to use: chromium, firefox, webkit, edge (default: chromium)
  -h, --help           Show this help message

Examples:
  cat test.js | tapout --timeout 5000
  cat test.js | tapout --browser firefox
  cat test.js | tapout -b webkit -t 3000
  cat test.js | tapout --browser edge
```

<details><summary><h2>Contents</h2></summary>

<!-- toc -->

- [Install](#install)
- [Use](#use)
  * [`-b`, `--browser`](#-b---browser)
  * [`-t`, `--timeout`](#-t---timeout)
- [Example Tests](#example-tests)
  * [More Examples](#more-examples)

<!-- tocstop -->

</details>

## Install

```sh
npm i -D @substrate-system/tapout
```

## Use

Just pipe some Javascript to this command.

```sh
cat ./test/index.js | npx tapout
```

### `-b`, `--browser`

Pass in the name of a browser to use. Default is Chrome.

Possibilities are `chromium`, `firefox`, `webkit`, or `edge`.

### `-t`, `--timeout`

Pass in a different timeout value. The default is 10 seconds.

```sh
cat test.js | npx tapout --timeout 5000
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
npm run test:all-examples  # Run passing examples
```


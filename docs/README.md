# HTML Reporter Examples
# [View the latest test results](test-results.html)

This directory contains examples of the HTML reporter output.

## Generated Files

When you run tapout with `--reporter html`, it generates a `test-results.html` file that looks like the examples below:

### Passing Tests
```bash
cat test/tape-test.js | npx tapout --reporter html
```

### Mixed Results
```bash
cat test/failing-test.js | npx tapout --reporter html
```

## Features

The HTML reporter includes:

- **Modern Design**: Clean, responsive layout that works on all devices
- **Test Summary**: Quick overview with pass/fail counts and percentages  
- **Individual Results**: Each test shows status, name, and duration
- **Browser Info**: Shows which browser was used for testing
- **Self-Contained**: Single HTML file with embedded CSS, no external dependencies

## GitHub Pages

Since the HTML files are completely self-contained, they can be easily hosted on GitHub Pages:

1. Generate your test report: `npm test | npx tapout --reporter html`
2. Commit the `test-results.html` file to your repo
3. Enable GitHub Pages in your repository settings
4. Access your test results at `https://yourusername.github.io/yourrepo/test-results.html`

## CI Integration

You can automate test report generation in your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run tests and generate report
  run: |
    npm test 2>&1 | npx tapout --reporter html
    
- name: Upload test results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results.html
```

import fs from 'fs'
import path from 'path'

const mainPageContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tapout - Browser Test Runner</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 3rem;
        }
        
        .header h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }
        
        .card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .card h2 {
            color: #667eea;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        
        .card p {
            color: #666;
            margin-bottom: 1.5rem;
        }
        
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0.75rem 1.5rem;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: transform 0.2s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .footer {
            text-align: center;
            color: white;
            opacity: 0.8;
        }
        
        .footer a {
            color: white;
            text-decoration: underline;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .content-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>🏆 Tapout</h1>
            <p>Run tests in a browser from the command line</p>
        </header>
        
        <div class="content-grid">
            <div class="card">
                <h2>📋 Example Test Results</h2>
                <p>See how Tapout renders test results in beautiful HTML format. View a sample test run with the simple test file.</p>
                <a href="./examples/simple-test-results.html" class="btn">View Example</a>
            </div>
            
            <div class="card">
                <h2>📚 API Documentation</h2>
                <p>Comprehensive TypeScript documentation for the Tapout library. Learn how to use the API and integrate it into your projects.</p>
                <a href="./api/" class="btn">View Documentation</a>
            </div>
        </div>
        
        <div class="footer">
            <p>Made with ❤️ by <a href="https://github.com/substrate-system/tapout" target="_blank">Substrate System</a></p>
        </div>
    </div>
</body>
</html>`

// Ensure the docs directory exists
const docsDir = path.join(process.cwd(), 'docs')
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true })
}

// Write the main page
fs.writeFileSync(path.join(docsDir, 'index.html'), mainPageContent)
console.log('✅ Main GitHub Pages index.html created successfully') 
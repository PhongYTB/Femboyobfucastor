const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer(async (req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        serveStatic(res, 'public/index.html', 'text/html');
    } else if (req.url === '/style.css') {
        serveStatic(res, 'public/style.css', 'text/css');
    } else if (req.url === '/api/obfuscate' && req.method === 'POST') {
        // Import obfuscate module
        const { handler } = require('./api/obfuscate');
        return handler(req, res);
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

function serveStatic(res, filePath, contentType) {
    const fullPath = path.join(__dirname, filePath);
    fs.readFile(fullPath, (err, content) => {
        if (err) {
            res.writeHead(500);
            res.end('Server error');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`FemboyObfucator running at http://localhost:${PORT}`);
    console.log(`🍑🐧 Ready to obfuscate Lua files in under 2 seconds!`);
});

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 80;
const DATA_DIR = '/data';
const MESSAGE_FILE = path.join(DATA_DIR, 'message.json');

// Ensure message file exists
if (!fs.existsSync(MESSAGE_FILE)) {
    fs.writeFileSync(MESSAGE_FILE, JSON.stringify({ message: 'Hello from Syncthing!' }));
}

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
};

function getLastModified() {
    try {
        const stats = fs.statSync(MESSAGE_FILE);
        return stats.mtime.toISOString().replace('T', ' ').slice(0, 19);
    } catch { return '-'; }
}

function readMessage() {
    try {
        return JSON.parse(fs.readFileSync(MESSAGE_FILE, 'utf8'));
    } catch { return { message: '' }; }
}

function writeMessage(message) {
    fs.writeFileSync(MESSAGE_FILE, JSON.stringify({ message }));
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // API endpoints
    if (url.pathname === '/api/info') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            hostname: os.hostname(),
            lastModified: getLastModified()
        }));
        return;
    }
    
    if (url.pathname === '/api/message') {
        if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                ...readMessage(),
                lastModified: getLastModified()
            }));
            return;
        }
        
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const { message } = JSON.parse(body);
                    writeMessage(message);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true,
                        lastModified: getLastModified()
                    }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid request' }));
                }
            });
            return;
        }
    }
    
    // Static files
    let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
    filePath = path.join(__dirname, filePath);
    
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.pdf': 'application/pdf'
};

http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/save-custom') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const payload = JSON.parse(body);
            const customFilePath = path.join(__dirname, 'custom_data.json');
            const baseFilePath = path.join(__dirname, 'data.json');
            
            const nodeId = payload.id || ('custom_' + Date.now());
            delete payload.id;
            
            let savedToBase = false;

            if (fs.existsSync(baseFilePath)) {
                let baseData = JSON.parse(fs.readFileSync(baseFilePath));
                if (baseData[nodeId]) {
                    payload.isCustom = false;
                    baseData[nodeId] = payload;
                    fs.writeFileSync(baseFilePath, JSON.stringify(baseData, null, 2));
                    savedToBase = true;
                }
            }
            
            if (!savedToBase) {
                let currentData = {};
                if (fs.existsSync(customFilePath)) {
                    currentData = JSON.parse(fs.readFileSync(customFilePath));
                }
                payload.isCustom = true;
                currentData[nodeId] = payload;
                fs.writeFileSync(customFilePath, JSON.stringify(currentData, null, 2));
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, id: nodeId }));
        });
        return;
    }

    if (req.method === 'POST' && req.url === '/api/delete-custom') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const payload = JSON.parse(body);
            const customFilePath = path.join(__dirname, 'custom_data.json');
            const baseFilePath = path.join(__dirname, 'data.json');
            
            let deleted = false;

            if (fs.existsSync(baseFilePath) && payload.id) {
                let baseData = JSON.parse(fs.readFileSync(baseFilePath));
                if (baseData[payload.id]) {
                    delete baseData[payload.id];
                    fs.writeFileSync(baseFilePath, JSON.stringify(baseData, null, 2));
                    deleted = true;
                }
            }
            
            if (!deleted && fs.existsSync(customFilePath) && payload.id) {
                let customData = JSON.parse(fs.readFileSync(customFilePath));
                if (customData[payload.id]) {
                    delete customData[payload.id];
                    fs.writeFileSync(customFilePath, JSON.stringify(customData, null, 2));
                }
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        });
        return;
    }
	
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';

    const extname = path.extname(filePath);
    let contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                if (filePath === './custom_data.json') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end('{}');
                    return;
                }
                res.writeHead(404);
                res.end('Файл не знайдено');
            } else {
                res.writeHead(500);
                res.end('Помилка сервера: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}).listen(PORT, () => {
    console.log(`http://localhost:${PORT}/`);
    console.log(`Зупинка: Ctrl + C`);
});
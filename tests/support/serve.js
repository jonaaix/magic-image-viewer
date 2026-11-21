import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../fixtures/', import.meta.url));
const port = Number(process.argv[2] ?? 5190);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.css': 'text/css', '.png': 'image/png' };

createServer(async (request, response) => {
    const path = normalize(decodeURIComponent(new URL(request.url, 'http://localhost').pathname)).replace(/^([/\\])+/, '');

    try {
        const body = await readFile(join(root, path || 'plain.html'));
        response.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
        response.end(body);
    } catch {
        response.writeHead(404);
        response.end();
    }
}).listen(port);

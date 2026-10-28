#!/usr/bin/env node
/**
 * DEV-сервер для VK Mini App (статика).
 * Раздаёт файлы проекта на порту 3000, блокируя доступ к чувствительным
 * директориям: .git (там токен), download, skills, upload, scripts, .env
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = '/home/z/my-project';

const BLOCKED = new Set([
  '.git', '.env', 'download', 'skills', 'upload', 'scripts',
  'node_modules', '.devserver', 'worklog.md', '.zscripts'
]);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (e) {
    res.writeHead(400); res.end('Bad Request'); return;
  }

  // Запрет traversal-атак и блок-лист
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const parts = safePath.split('/').filter(Boolean);

  if (parts.some(p => BLOCKED.has(p))) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  let filePath = path.join(ROOT, safePath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  // Каталог → index.html внутри него
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`DEV server: http://localhost:${PORT} (root: ${ROOT})`);
});

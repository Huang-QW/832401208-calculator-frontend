/**
 * 前端静态文件服务器（零依赖，仅用于本地预览）。
 *
 * 为什么需要它：直接双击 index.html（file:// 协议）也能跑，
 * 但部分浏览器对 file:// 页面发起的跨域请求限制更严格，
 * 用一个小服务器打开更接近真实部署环境，也更方便手机同一局域网访问。
 *
 * 用法：node scripts/dev-server.js [端口]
 */

'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const PORT = Number.parseInt(process.argv[2], 10) || 5173;
const ROOT = path.join(__dirname, '..', 'src');

/** 扩展名 -> Content-Type 映射 */
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/**
 * 把 URL 路径安全地解析为磁盘路径，防止 ../ 目录穿越。
 * @param {string} urlPath
 * @returns {string} 绝对路径
 */
function resolveSafePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const absolute = path.resolve(ROOT, relative);
  if (!absolute.startsWith(ROOT)) {
    throw new Error('非法路径');
  }
  return absolute;
}

const server = http.createServer((req, res) => {
  let filePath;
  try {
    filePath = resolveSafePath(req.url);
  } catch {
    res.writeHead(403).end('403 Forbidden');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${req.url}`);
      return;
    }
    const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log('==================================================');
  console.log('  计算器前端已启动（本地预览）');
  console.log(`  请用浏览器打开：http://localhost:${PORT}`);
  console.log('  请确保后端已启动，否则页面会提示「后端未连接」');
  console.log('  按 Ctrl + C 停止');
  console.log('==================================================');
});

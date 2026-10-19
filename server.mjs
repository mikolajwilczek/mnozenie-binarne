import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, resolve, sep } from 'node:path';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), process.argv[2] || '.');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const port = Number(process.env.PORT || 4173);
http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url,'http://localhost');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!path.startsWith(root + sep) && path !== resolve(root,'index.html')) { res.writeHead(403);res.end();return; }
    const data = await readFile(path);
    res.writeHead(200,{'Content-Type':types[extname(path)] || 'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(data);
  } catch {res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Nie znaleziono pliku.');}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://localhost:${port}`));

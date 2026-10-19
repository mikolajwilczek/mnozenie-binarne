import { mkdir, copyFile } from 'node:fs/promises';
const files = ['index.html','favicon.svg','LICENSE','src/engine.js','src/worksheet.js','src/app.js','src/style.css'];
await mkdir(new URL('dist/src/',import.meta.url),{recursive:true});
for (const file of files) await copyFile(new URL(file,import.meta.url),new URL(`dist/${file}`,import.meta.url));
console.log('Gotowe: dist/ — statyczna strona, bez zależności i backendu.');

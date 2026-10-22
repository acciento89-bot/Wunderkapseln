import { posix } from 'node:path';
// Portable, fully offline QA build of our own modules. No CDN or network imports.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const paths=['core/voice-pool.mjs','core/feedback.mjs','ui/sounds.mjs','web/audio.mjs','core/restoration.mjs','ui/world-scenes.mjs','ui/icon.mjs','core/levels.mjs','core/game.mjs','core/profile.mjs','core/session.mjs','core/storage.mjs','core/strategy.mjs','core/controller.mjs','ui/strings.mjs','ui/art.mjs'];
const imports=(source,importer)=>source.replace(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];?/g,(_,names,path)=>{
 const canonical=path.startsWith('/')?path:posix.resolve('/',posix.dirname(importer),path);
 return `const {${names}} = require(${JSON.stringify(canonical)});`;
});
let script='const factories = {}, modules = {}; function require(id){ if(modules[id]) return modules[id]; const exports={}; modules[id]=exports; factories[id](exports); return exports; }\n';
for(const path of paths){const source=await readFile(path,'utf8');const names=[...source.matchAll(/export\s+(?:const|let|function|class)\s+(\w+)/g)].map(m=>m[1]);script+=`factories['/${path}']=function(exports){\n${imports(source,path).replace(/export\s+(?=(?:const|let|function|class)\s)/g,'')}\nObject.assign(exports,{${names.join(',')}});\n};\n`;}
script+=`(async()=>{${imports(await readFile('web/app.mjs','utf8'),'web/app.mjs')}})();`;
const css=await readFile('web/style.css','utf8');let html=await readFile('web/index.html','utf8');html=html.replace('<link rel="stylesheet" href="/web/style.css">',`<style>${css}</style>`).replace('<script type="module" src="/web/app.mjs"></script>',`<script type="module">${script.replaceAll('</script','<\\/script')}</script>`);
await mkdir('dist',{recursive:true});await writeFile('dist/Wunderkapseln-preview.html',html);console.log('Offline preview generated. Native App.js is not a WebView.');

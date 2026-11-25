import {readFile,writeFile,mkdir,copyFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
const files=['index.html','styles.css','core.js','app.js','manifest.webmanifest','sw.js'];
for(const file of files)await copyFile(path.join(root,file),path.join(dist,file));
const css=await readFile(path.join(root,'styles.css'),'utf8');
const core=await readFile(path.join(root,'core.js'),'utf8');
// Portable files do not register a worker or depend on external files.
const app=(await readFile(path.join(root,'app.js'),'utf8')).replace(/if\('serviceWorker'in navigator[^\n]+/,'');
const hash=text=>"'sha256-"+createHash('sha256').update(text).digest('base64')+"'";
let html=await readFile(path.join(root,'index.html'),'utf8');
const policy="default-src 'none'; script-src "+hash(core)+' '+hash(app)+"; style-src "+hash(css)+"; img-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
html=html.replace(/<meta http-equiv="Content-Security-Policy"[^>]+>/,'<meta http-equiv="Content-Security-Policy" content="'+policy+'">')
.replace('<link rel="stylesheet" href="./styles.css">','<style>'+css+'</style>').replace('<link rel="manifest" href="./manifest.webmanifest">','')
.replace('<script src="./core.js"></script>','<script>'+core+'</script>').replace('<script src="./app.js"></script>','<script>'+app+'</script>');
await writeFile(path.join(dist,'OceanCentinell_Company_Demo.html'),html);
console.log('Built website and self-contained company demo.');

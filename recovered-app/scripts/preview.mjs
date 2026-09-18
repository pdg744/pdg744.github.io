// Serve the exported SPA at its real /app base path, with local deep-link fallback.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.ico':'image/x-icon','.mp4':'video/mp4','.json':'application/json','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/'){res.writeHead(302,{Location:'/app/'});res.end();return;}
    if(!url.pathname.startsWith('/app/')){res.writeHead(404);res.end();return;}
    const relative=decodeURIComponent(url.pathname.slice(5));
    let file=path.resolve(root,relative||'index.html');
    if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    try{if(!(await fs.stat(file)).isFile())throw Error();}catch{
      if(path.extname(relative)){res.writeHead(404);res.end();return;}
      file=path.join(root,'index.html');
    }
    const data=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  }catch{res.writeHead(500);res.end();}
}).listen(4173,'127.0.0.1',()=>console.log('Recovered app: http://127.0.0.1:4173/app/'));

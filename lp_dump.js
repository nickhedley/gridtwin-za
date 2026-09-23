const {JSDOM}=require('jsdom');const fs=require('fs'),path=require('path');const R=process.env.R||'testroot';
const html=fs.readFileSync(R+'/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(R)+'/index.html',beforeParse(w){
w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()});w.L=new Proxy({},{get(){return function(){return ch();};}});
w.onerror=()=>{};w.console.warn=()=>{};w.console.log=()=>{};Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true});w.URL.createObjectURL=()=>'blob:x';w.Worker=function(){this.postMessage=()=>{};};
w.fetch=async u=>{try{const c=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles)/,'');const t=fs.readFileSync(path.join(path.resolve(R),c),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
setTimeout(()=>{const w=dom.window;w.__done=null;const s=w.document.createElement('script');s.textContent=process.argv[2];
w.document.body.appendChild(s);const t=setInterval(()=>{if(w.__done){require('fs').writeFileSync(process.argv[3]||'/tmp/out.txt',String(w.__done));clearInterval(t);process.exit(0);}},500);},6000);

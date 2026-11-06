import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge,createIadHttpHandler} from '../lib/server/index.js';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('read queries share requests and retain loaded data across refreshes and page remounts',{timeout:60000},async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-query-cache-'));
 const bridge=new PythonBridge({cwd:path.resolve(app,'../..'),dbPath:path.join(root,'test.db')});
 const group=await bridge.execute('dataset_group_create',{name:'原始数据集'});
 const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {useResource} from './src/client/useResource.ts';import {request} from './src/client/api.ts';
 function Result({revision}){const data=useResource('/datasets',revision);return <p className="result">{data.data?.groups[0]?.name || '正在加载'}</p>}
 function App(){const [open,setOpen]=React.useState(true),[revision,setRevision]=React.useState(0);return <><button id="toggle" onClick={()=>setOpen(v=>!v)}>切页</button><button id="refresh" onClick={()=>setRevision(v=>v+1)}>刷新</button><button id="rename" onClick={()=>request('/datasets/groups/'+${JSON.stringify(group.group_id)},{name:'修改后的数据集'},'PATCH')}>改名</button>{open&&<><Result revision={revision}/><Result revision={revision}/></>}</>};createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,write:false,format:'iife',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
 const api=createIadHttpHandler(bridge);let reads=0,hold=false,release;
 const gate=new Promise(resolve=>release=resolve);
 const server=http.createServer(async(req,res)=>{
  if(req.url==='/app.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].contents);}
  if(req.url==='/api/iad/datasets'){reads++;if(hold)await gate;}
  if(req.url.startsWith('/api/iad/'))return api(req,res);
  res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/app.js"></script>');
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let driver;
 try{
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(new firefox.Options().addArguments('-headless').setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox')).setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  await driver.get(`http://127.0.0.1:${server.address().port}`);
  const values=async()=>Promise.all((await driver.findElements(By.css('.result'))).map(e=>e.getText()));
  await driver.wait(async()=>JSON.stringify(await values())===JSON.stringify(['原始数据集','原始数据集']),10000);
  assert.equal(reads,1,'相同查询的两个调用方只发一次请求');
  hold=true;await driver.findElement(By.id('refresh')).click();await driver.wait(()=>reads===2,5000);
  assert.deepEqual(await values(),['原始数据集','原始数据集'],'刷新期间保留已加载数据');
  await driver.findElement(By.id('toggle')).click();await driver.findElement(By.id('toggle')).click();
  assert.deepEqual(await values(),['原始数据集','原始数据集'],'切回页面立即显示上次查询结果');
  assert.equal(reads,2,'切页复用同一在途请求');hold=false;release();
  await driver.findElement(By.id('rename')).click();
  await driver.wait(async()=>JSON.stringify(await values())===JSON.stringify(['修改后的数据集','修改后的数据集']),10000,'写入后自动刷新共享查询，不能复活旧名称');
 }finally{hold=false;release();await driver?.quit();bridge.destroy();await new Promise(resolve=>server.close(resolve));}
});

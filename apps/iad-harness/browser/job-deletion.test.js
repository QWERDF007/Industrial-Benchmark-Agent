import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge,createIadHttpHandler} from '../lib/server/index.js';

const app=fileURLToPath(new URL('..',import.meta.url));

for(const kind of ['exploration','knowledge'])test(`${kind} deletion hides a selected job after refresh and reopening while older visible jobs remain accessible`,{timeout:45000},async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-job-deletion-'));
 const bridge=new PythonBridge({cwd:path.resolve(app,'../..'),dbPath:path.join(root,'test.db')});
 let driver,server;
 try{
  execFileSync(bridge.pythonPath,[path.join(app,'test/fixtures/knowledge_dataset.py'),root]);
  const data=JSON.parse(execFileSync(bridge.pythonPath,['-c',`
import json,sys
from pathlib import Path
from iad_core.dataset.registry import DatasetRegistry,DatasetImport
from iad_core.storage.database import Database
from iad_core.workbench.runtime import WorkbenchRuntime
root=Path(sys.argv[1]);kind=sys.argv[2]
runtime=WorkbenchRuntime(Database(str(root/'test.db')))
try:
 config=DatasetRegistry(runtime.db).import_labelme(DatasetImport(format='labelme',name='作业删除验证',image_dir=str(root/'images'),annotation_dir=str(root/'labels')))
 ids=[]
 for index in range(32):
  job=runtime.jobs.start('ANALYSIS_WORKFLOW',config.task.task_id,dict(dataset_id=config.dataset.id,dataset_ids=[config.dataset.id],analysis_kind=kind,kind='normal' if kind=='knowledge' else None,sample_ids=[config.dataset.id+':part-0.png']),None,'等待原生宿主')
  runtime.jobs.cancel(job['run_id'],('ANALYSIS_WORKFLOW',));ids.append(job['run_id'])
 print(json.dumps(dict(dataset_id=config.dataset.id,selected_id=ids[1],older_id=ids[0])))
finally: runtime.close()
`,root,kind],{cwd:path.resolve(app,'../..'),env:{...process.env,PYTHONPATH:path.resolve(app,'../../python')},encoding:'utf8'}));
  const bundle=await build({stdin:{contents:`
   import React from 'react';import {createRoot} from 'react-dom/client';
   import {QueryClientProvider} from '@tanstack/react-query';
   import {queryClient} from './src/client/query-client.ts';import {useJobs} from './src/client/useJobs.ts';
   import {request} from './src/client/api.ts';import {DeleteAction} from './src/client/components/DeleteAction.tsx';
   const selected=new URL(location.href).searchParams.get('selected');
   function App(){const state=useJobs(${JSON.stringify(kind)},${JSON.stringify(data.dataset_id)},()=>{},selected);
    return <main><p role="status">{state.error}</p>{state.jobs.map(job=><div key={job.run_id} data-job={job.run_id}>
     {job.run_id}<DeleteAction title="删除作业" name={job.run_id} onDelete={async()=>{await request('/analysis/delete/'+job.run_id,{});state.refresh();}}/>
    </div>)}</main>;}
   createRoot(document.getElementById('root')).render(<QueryClientProvider client={queryClient}><App/></QueryClientProvider>);
  `,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const handler=createIadHttpHandler(bridge);
  server=http.createServer(async(req,res)=>{
   const pathname=new URL(req.url,'http://localhost').pathname;
   if(pathname==='/app.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle.outputFiles[0].contents);return;}
   if(pathname==='/'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<meta charset="utf-8"><div id="root"></div><script src="/app.js"></script>');return;}
   await handler(req,res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const jobs=async()=>{
   const response=await fetch(base+'/api/iad/analysis/jobs?'+new URLSearchParams({dataset_id:data.dataset_id,analysis_kind:kind}));
   assert.equal(response.status,200);return (await response.json()).jobs;
  };
  const listed=await jobs();assert.equal(listed.length,30);
  assert.ok(!listed.some(job=>job.run_id===data.selected_id||job.run_id===data.older_id));
  const options=new firefox.Options().addArguments('-headless');
  if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
   .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  const selected=By.css('[data-job="'+data.selected_id+'"]');
  await driver.get(base+'/?selected='+data.selected_id);
  const row=await driver.wait(until.elementLocated(selected),10000);
  await(await row.findElement(By.css('button[data-icon="delete"]'))).click();
  await(await driver.wait(until.elementLocated(By.css('dialog[open] #confirm-accept')),5000)).click();
  await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,5000);
  await driver.wait(async()=>(await driver.findElements(selected)).length===0,5000,'已删除的选中作业不能重新补回列表');
  assert.deepEqual((await jobs()).map(job=>job.run_id),listed.map(job=>job.run_id));
  const history=await(await fetch(base+'/api/iad/analysis/status/'+data.selected_id)).json();
  assert.ok(history.deleted_at,'历史记录保留真实删除标记');
  await driver.navigate().refresh();
  await driver.wait(async()=>(await driver.findElements(By.css('[data-job]'))).length===30,10000);
  assert.equal((await driver.findElements(selected)).length,0,'保留选中ID重新加载不能恢复已删除作业');
  await driver.get(base+'/?selected='+data.older_id);
  await driver.wait(until.elementLocated(By.css('[data-job="'+data.older_id+'"]')),10000);
  assert.equal(await(await driver.findElement(By.css('[role="status"]'))).getText(),'');
 }finally{
  await driver?.quit();bridge.destroy();
  if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  await fs.rm(root,{recursive:true,force:true});
 }
});

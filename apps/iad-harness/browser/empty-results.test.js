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
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('V72 empty panes hide unusable filters and empty table headers across analysis pages',{timeout:60000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-empty-results-'));
  t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const bridge=new PythonBridge({cwd:path.resolve(app,'../..'),dbPath:path.join(root,'test.db')});
  t.after(()=>bridge.destroy());
  execFileSync(bridge.pythonPath,['-c',"from PIL import Image;import sys;from pathlib import Path;p=Path(sys.argv[1]);(p/'images').mkdir();(p/'labels').mkdir();Image.new('RGB',(80,60),'blue').save(p/'images'/'part.png')",root]);
  const dataset=await bridge.execute('dataset_import',{format:'labelme',name:'空作业范围',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
  const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';
    import {ExplorationPage} from './src/client/components/ExplorationPage.tsx';import {KnowledgePage} from './src/client/components/KnowledgePage.tsx';
    import {ConsistencyPage} from './src/client/components/ConsistencyPage.tsx';import {AuditPage} from './src/client/components/AuditPage.tsx';
    import {Workspace,WorkspaceContext} from './src/client/workspace.tsx';import {WorkbenchModelProvider} from './src/client/models.tsx';import {workbenchStyles} from './src/client/styles.ts';
    const workspace=new Workspace(null);function App(){const [page,setPage]=React.useState('audit'),dataset=${JSON.stringify(dataset)};
      const props={dataset,datasets:[dataset],groups:[],refreshRevision:0,onDatasetsChanged:()=>{}};
      return <WorkspaceContext.Provider value={workspace}><WorkbenchModelProvider><style>{workbenchStyles}</style><nav>{['audit','exploration','knowledge','consistency'].map(id=><button key={id} id={id} onClick={()=>setPage(id)}>{id}</button>)}</nav>
      <main className="iad-workbench" data-page={'industrial-'+page}>{page==='audit'?<AuditPage {...props}/>:page==='exploration'?<ExplorationPage {...props}/>:page==='knowledge'?<KnowledgePage {...props}/>:<ConsistencyPage {...props}/>}</main></WorkbenchModelProvider></WorkspaceContext.Provider>}
    createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const handler=createIadHttpHandler(bridge);
  const server=http.createServer((req,res)=>{if(req.url==='/app.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle.outputFiles[0].contents);return;}
    if(req.url.startsWith('/api/iad'))return handler(req,res);res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script src="/app.js"></script>');});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const options=new firefox.Options().addArguments('-headless');options.setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  t.after(()=>driver.quit());await driver.get(`http://127.0.0.1:${server.address().port}`);
  for(const page of ['audit','exploration','knowledge','consistency']){
    await driver.findElement(By.id(page)).click();
    const content=await driver.wait(until.elementLocated(page==='consistency'?By.css('.dc-root'):By.id(page+'-page')),5000);
    await driver.wait(async()=>(await content.getText()).includes('当前没有'),10000);
    assert.equal((await content.findElements(By.css('table thead'))).length,0,`${page} 空作业不保留表头`);
    const visibleFilters=await content.findElements(By.css('.audit-filters,.exp-job-filters,.dc-jobs-filters,#jobs-filterset,#knowledge-filterset'));
    assert.equal((await Promise.all(visibleFilters.map(element=>element.isDisplayed()))).filter(Boolean).length,0,`${page} 空作业不显示无效筛选`);
    if(page==='consistency'){
      const surface=await driver.executeScript(`const panel=document.querySelector('.dc-results-section'),style=getComputedStyle(panel);
        return {background:style.backgroundColor,border:style.borderTop,borderRadius:style.borderRadius,padding:style.padding,nestedEmpty:panel.querySelectorAll('.dc-empty').length};`);
      assert.deepEqual(surface,{background:'rgb(255, 255, 255)',border:'1px solid rgb(219, 226, 235)',borderRadius:'6px',padding:'18px 20px 22px',nestedEmpty:0},'V72空态与有结果时共用完整白底容器');
    }
  }
});

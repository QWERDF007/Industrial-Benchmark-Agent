import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {build} from 'esbuild';
import {Builder, By, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge, createIadHttpHandler} from '../lib/server/index.js';
import {viewport} from './workbench-layout.js';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('1920 audit keeps PASS and model failure separate from same-image evidence and returns to the sample', {timeout:90000}, async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-audit-consistency-browser-'));
  let failVisual = false;
  const model = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'GET') return res.end(JSON.stringify({data:[{id:'local-audit-fixture'}]}));
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw);
    if (req.url === '/tokenize') return res.end(JSON.stringify({count:1000,max_model_len:262144}));
    const content = body.messages[0].content;
    const images = content.filter(item => item.type === 'text' && item.text.startsWith('视觉证据：')).map(item => JSON.parse(item.text.slice(5)));
    const kind = body.response_format.json_schema.name;
    let result;
    if (kind === 'KnowledgeDraft') result = {summary:'蓝色表面',checks:[{title:'表面外观',subject:'主体',location:'全图',criterion:'表面连续',allowed_variations:[],support_evidence_ids:images.map(item=>item.evidence_id),counter_evidence_ids:[],limitations:[],status:'supported'}],suspects:[],limitations:[]};
    else {
      assert.equal(kind,'JointAnalysis');
      if (failVisual) {res.statusCode=503;return res.end(JSON.stringify({error:'fixture unavailable'}));}
      const view={description:'表面连续',position_analysis:'主体区域',illumination_analysis:'均匀照明'};
      const knowledge=JSON.parse(content[0].text.split('冻结知识：')[1].split('\n')[0]);
      result={...view,suggested_label:'PASS',reason_category:'NORMAL',confidence:.8,evidence_ids:images.map(item=>item.evidence_id),
        global_view:view,check_assessments:knowledge.checks.map(check=>({...view,check_id:check.check_id,status:'normal',evidence_ids:[images[0].evidence_id]})),
        region_observations:images.filter(item=>item.role==='roi' && item.representation==='raw').map((_,index)=>({...view,region_index:index+1})),findings:[],resolved_findings:[]};
    }
    res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]}));
  });
  await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));
  const env={LIVE_VLM_ENDPOINT:`http://127.0.0.1:${model.address().port}/v1`,LIVE_VLM_MODEL:'local-audit-fixture',LIVE_VLM_CAPACITY_MODE:'vllm_tokenize',IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES:'2'};
  const previous=Object.fromEntries(Object.keys(env).map(key=>[key,process.env[key]]));Object.assign(process.env,env);
  const bridge=new PythonBridge({cwd:path.resolve(app,'../..'),dbPath:path.join(root,'test.db')});
  t.after(async()=>{bridge.destroy();await new Promise(resolve=>model.close(resolve));for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}});
  execFileSync(bridge.pythonPath,[path.join(app,'test/fixtures/knowledge_dataset.py'),root]);
  await fs.copyFile(path.join(root,'images/part-2.png'),path.join(root,'images/copy.png'));
  const label=JSON.parse(await fs.readFile(path.join(root,'labels/part-2.json'),'utf8'));
  label.shapes[0].label='另一类别';await fs.writeFile(path.join(root,'labels/copy.json'),JSON.stringify(label));
  const dataset=await bridge.execute('dataset_import',{format:'labelme',name:'审计两轴',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels'),annotation_policy:{policy_id:'same',annotation_role:'REFERENCE',annotation_coverage:'EXHAUSTIVE'}});
  async function terminal(operation,job) {
    const end=Date.now()+10000;
    while(['PENDING','RUNNING'].includes(job.status) && Date.now()<end) {await delay(25);job=await bridge.execute(operation,{run_id:job.run_id});}
    return job;
  }
  const mining=await terminal('knowledge_status',await bridge.execute('knowledge_start',{request:{kind:'normal',image_count:2,images:['part-0.png','part-1.png'].map(name=>dataset.dataset_id+':'+name)}}));
  assert.equal(mining.status,'COMPLETED',JSON.stringify(mining.errors));
  const target=dataset.dataset_id+':part-2.png';
  const audited=await terminal('audit_status',await bridge.execute('audit_start',{dataset_id:dataset.dataset_id,sample_ids:[target]}));
  assert.equal(audited.status,'COMPLETED',JSON.stringify(audited.errors));
  const detail=await bridge.execute('sample_get',{sample_id:target});
  assert.equal(detail.suggestion.suggested_label,'PASS');assert.equal(detail.consistency.results.length,1);
  const evidenceId=detail.consistency.results[0].evidence_id;
  failVisual=true;
  const failed=await terminal('audit_status',await bridge.execute('audit_start',{dataset_id:dataset.dataset_id,sample_ids:[dataset.dataset_id+':copy.png']}));
  assert.equal(failed.status,'FAILED');
  const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {apply} from './src/client/index.ts';
    const entries=[],mains=new Map(),listeners=new Set();let panel=null;
    const layout={panelInfo:{getSnapshot:()=>({activePanelId:panel}),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}},selectPanel:id=>{panel=id;listeners.forEach(f=>f())}};
    apply({layout,slots:{inject:(_,f)=>f(),register:(o,c)=>{if(o.name==='main')mains.set(o.key,c);else if(o.name==='sidebar.panellist')entries.push(o)}}});
    function App(){const [id,setId]=React.useState(panel||entries[0].id);React.useEffect(()=>layout.panelInfo.subscribe(()=>setId(panel)),[]);const Page=mains.get(id);return <><nav>{entries.map(e=><button key={e.id} onClick={()=>layout.selectPanel(e.id)}>{e.label}</button>)}</nav><div style={{height:'calc(100% - 40px)'}}>{Page&&<Page/>}</div></>}
    createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const api=createIadHttpHandler(bridge);
  const server=http.createServer((req,res)=>{
    if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].contents);}
    if(req.url.startsWith('/api/iad'))return api(req,res);
    res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><style>html,body,#root{height:100%;margin:0}body{font-family:system-ui;font-size:14px}</style><div id="root"></div><script src="/browser.js"></script>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let driver;
  try {
    const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'geckodriver')).build();
    await viewport(driver,1920,1080);
    const open=sample=>driver.get(`http://127.0.0.1:${server.address().port}/?${new URLSearchParams({iad:JSON.stringify({pageId:'industrial-audit',datasetId:dataset.dataset_id,selected:sample,tab:'results'})})}`);
    await open(target);
    await driver.wait(until.elementLocated(By.css('[aria-label="审计一致性检查"]')),10000);
    assert.match(await driver.findElement(By.css('[aria-label="审计一致性检查"]')).getText(),/确认冲突 1/);
    await driver.findElement(By.css('[aria-label="审计一致性检查"] summary')).click();
    await driver.findElement(By.css('[aria-label="审计一致性检查"] button')).click();
    await driver.wait(until.elementLocated(By.css(`[data-evidence-id="${evidenceId}"]`)),5000);
    const back=await driver.findElement(By.xpath('//button[normalize-space(.)="返回审计"]'));await back.click();
    await driver.wait(until.elementLocated(By.css('[aria-label="审计一致性检查"]')),5000);
    const location=await driver.executeScript('return JSON.parse(new URL(location.href).searchParams.get("iad"))');
    assert.equal(location.pageId,'industrial-audit');assert.equal(location.selected,target);
    await fs.writeFile('/tmp/iad-audit-consistency-pass-1920.png',await driver.takeScreenshot(),'base64');
    await open(dataset.dataset_id+':copy.png');
    await driver.wait(until.elementLocated(By.css('[aria-label="审计一致性检查"]')),5000);
    assert.match(await driver.findElement(By.css('[aria-label="审计一致性检查"]')).getText(),/确认冲突 1/);
    assert.match(await driver.findElement(By.css('.iad-inspector')).getText(),/尚无模型观察/);
    await fs.writeFile('/tmp/iad-audit-consistency-failure-1920.png',await driver.takeScreenshot(),'base64');
    await driver.findElement(By.xpath('//button[normalize-space(.)="报告"]')).click();
    await driver.wait(until.elementLocated(By.css('[aria-label="范围检查报告"]')),5000);
    assert.match(await driver.findElement(By.css('[aria-label="范围检查报告"]')).getText(),/当前范围 Gold · 4 张[\s\S]*不可纳入 4/);
    await fs.writeFile('/tmp/iad-gold-quality-report-1920.png',await driver.takeScreenshot(),'base64');
  } catch(error) {
    if(driver)await fs.writeFile('/tmp/iad-audit-consistency-browser-failure.png',await driver.takeScreenshot(),'base64');
    throw error;
  } finally {if(driver)await driver.quit();await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});

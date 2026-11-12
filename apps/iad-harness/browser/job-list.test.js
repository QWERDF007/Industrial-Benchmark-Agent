import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('shared job list displays live progress and duration, extensible actions and bounded pagination',{timeout:60000},async t=>{
 const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';
import {JobList} from './src/client/components/JobList.tsx';
import {useJobList} from './src/client/useJobList.ts';
import {workbenchStyles} from './src/client/styles.ts';
window.jobNow=Date.parse('2026-11-05T12:00:10Z');Date.now=()=>window.jobNow;
const initial={run_id:'analysis-first',root_run_id:'analysis-first',dataset_id:'dataset',dataset_ids:['dataset'],status:'RUNNING',completed:8,total_samples:100,failed:0,submitted_at:'2026-11-05T12:00:00Z',started_at:'2026-11-05T12:00:00Z',finished_at:null,model_name:'test-model'};
function App(){const [jobs,setJobs]=React.useState([initial]),[selected,setSelected]=React.useState('');const list=useJobList(jobs,'dataset',selected);window.selectExternal=setSelected;window.updateJob=patch=>setJobs(rows=>rows.map((job,index)=>index?job:{...job,...patch}));window.addJobs=()=>setJobs(rows=>[...rows,...Array.from({length:8},(_,i)=>({...initial,run_id:'analysis-older-'+i,root_run_id:'analysis-older-'+i,status:'COMPLETED',finished_at:'2026-11-05T12:00:15Z',submitted_at:'2026-11-04T12:00:00Z'}))]);return <main className="iad-workbench"><style>{workbenchStyles}</style><JobList title="测试作业" list={list} datasets={[{dataset_id:'dataset',name:'测试数据集'}]} actions={{status:job=>window.lastAction='status:'+job.run_id,prompt:job=>window.lastAction='prompt:'+job.run_id,delete:async job=>setJobs(rows=>rows.filter(row=>row.run_id!==job.run_id)),additional:[{id:'statistics',label:'统计',icon:'stats',onClick:job=>window.lastAction='stats:'+job.run_id}]}}/></main>}
createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/app.js'?'application/javascript':'text/html;charset=utf-8');res.end(req.url==='/app.js'?bundle.outputFiles[0].contents:'<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/app.js"></script>');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let driver;t.after(async()=>{await driver?.quit();await new Promise(resolve=>server.close(resolve));});
 const options=new firefox.Options().addArguments('-headless').setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
 driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
 await driver.get(`http://127.0.0.1:${server.address().port}`);
 await driver.wait(until.elementLocated(By.css('table tbody tr')),10000);
 const texts=selector=>driver.executeScript('return [...document.querySelectorAll(arguments[0])].map(node=>node.textContent.trim())',selector);
 assert.deepEqual(await texts('thead th'),['作业ID','状态','数据集','进度','提交时间','耗时','操作']);
 assert.deepEqual((await texts('tbody td')).slice(0,4),['analysis-first','执行中','测试数据集','8 / 100']);
 assert.equal((await texts('tbody td'))[5],'00:10');
 assert.equal((await driver.findElements(By.css('.iad-pagination'))).length,0);
 await driver.executeScript('window.jobNow+=5000;window.updateJob({completed:16})');
 await driver.wait(async()=>(await texts('tbody td'))[5]==='00:15',3000);
 assert.equal((await texts('tbody td'))[3],'16 / 100');
 for(const [title,result] of [['查看作业状态','status:analysis-first'],['查看提示词','prompt:analysis-first'],['统计','stats:analysis-first']]){
  await(await driver.findElement(By.css('tbody button[title="'+title+'"]'))).click();
  assert.equal(await driver.executeScript('return window.lastAction'),result);
 }
 assert.equal(await(await driver.findElement(By.css('tbody button[title="删除作业"]'))).isEnabled(),false);
 await driver.executeScript("window.updateJob({status:'PARTIAL',completed:59,finished_at:'2026-11-05T12:00:20Z'})");
 await driver.wait(async()=>(await texts('tbody td'))[1]==='部分成功',3000);
 await driver.executeScript('window.jobNow+=100000');
 assert.equal((await texts('tbody td'))[5],'00:20');
 await driver.executeScript(`window.jobNow=Date.parse('2026-11-05T15:00:00Z');window.updateJob({
  status:'RUNNING',completed:100,finished_at:null,phase_timings:[
   {phase:'AUDITING',started_at:'2026-11-05T12:00:00Z',finished_at:'2026-11-05T12:20:00Z'},
   {phase:'AUDITING',started_at:'2026-11-05T12:30:00Z',finished_at:null},
   {phase:'GENERATING_AUDIT_REPORT',started_at:'2026-11-05T14:55:00Z',finished_at:null}]})`);
 await driver.wait(async()=>(await texts('tbody td'))[5]==='25:00',3000);
 await driver.executeScript('window.jobNow+=3000');
 await driver.wait(async()=>(await texts('tbody td'))[5]==='25:03',3000);
 await driver.executeScript(`window.updateJob({status:'COMPLETED',finished_at:'2026-11-05T15:00:03Z',phase_timings:[
  {phase:'AUDITING',started_at:'2026-11-05T12:00:00Z',finished_at:'2026-11-05T12:20:00Z'},
  {phase:'AUDITING',started_at:'2026-11-05T12:30:00Z',finished_at:null},
  {phase:'GENERATING_AUDIT_REPORT',started_at:'2026-11-05T14:55:00Z',finished_at:'2026-11-05T15:00:03Z'}]})`);
 await driver.wait(async()=>(await texts('tbody td'))[1]==='已完成',3000);
 await driver.executeScript('window.jobNow+=86400000');
 assert.equal((await texts('tbody td'))[5],'25:03');
 await driver.executeScript('window.addJobs()');
 await driver.wait(async()=>(await driver.findElements(By.css('tbody tr'))).length===8,3000);
 await driver.executeScript("window.selectExternal('analysis-older-7')");
 await driver.wait(async()=>(await texts('tbody td'))[0]==='analysis-older-7',3000,'外部定位较早作业时显示其所在分页');
 await driver.executeScript("window.selectExternal('analysis-first')");
 await driver.wait(async()=>(await texts('tbody td'))[0]==='analysis-first',3000);
 const next=await driver.findElement(By.xpath('//nav/button[normalize-space(.)="下一页"]'));await next.click();
 assert.equal((await texts('tbody td'))[0],'analysis-older-7');
 await(await driver.findElement(By.css('tbody button[title="删除作业"]'))).click();
 await(await driver.wait(until.elementLocated(By.xpath('//dialog[@open]//button[normalize-space(.)="删除作业"]')),3000)).click();
 await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,3000);
 assert.equal((await driver.findElements(By.css('.iad-pagination'))).length,0,'删除末页唯一作业后隐藏单页分页');
});

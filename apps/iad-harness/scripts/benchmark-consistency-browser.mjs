import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const root=process.argv[2];
const jobs=process.argv.slice(3);
assert.ok(root&&jobs.length>=2,'提供输出目录及至少两个实际作业 ID');
const authUrl=(await fs.readFile(process.env.IAD_BENCHMARK_AUTH_FILE,'utf8')).trim();
const origin=new URL(authUrl).origin;
const login=await fetch(authUrl,{redirect:'manual'});
const cookie=login.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
assert.ok(cookie,'当前服务未返回认证会话');
async function read(route){
  const response=await fetch(origin+'/api/iad/'+route,{headers:{Cookie:cookie}});
  assert.equal(response.status,200);
  return response.json();
}
const catalog=await read('datasets');
const summaries=await Promise.all(jobs.map(id=>read(`analysis/status/${id}?summary=true`)));
assert.ok(summaries.some(job=>job.total_samples>=5000),'必须包含至少 5000 张主图的真实作业');
const catalogIds=catalog.datasets.map(dataset=>dataset.dataset_id);
const history=await read('analysis/jobs?'+new URLSearchParams({dataset_ids:JSON.stringify(catalogIds),analysis_kind:'consistency',summary:'true'}));
const targetDatasets=new Set(summaries.flatMap(job=>job.dataset_ids.length?job.dataset_ids:[job.dataset_id]));
const initialJob=history.jobs.find(job=>!jobs.includes(job.run_id)&&job.total_samples>=18&&
  (job.dataset_ids.length?job.dataset_ids:[job.dataset_id]).every(id=>!targetDatasets.has(id)));
assert.ok(initialJob,'需要来自其他数据集的作业作为初始页面，避免提前加载目标首页的缩略图');
await fs.mkdir(root,{recursive:true});
const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access')
  .setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox')
  .setPreference('browser.cache.disk.enable',false).setPreference('browser.cache.memory.enable',false);
const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
  .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
const measurements=[];
try{
  await driver.manage().window().setRect({width:1920,height:1080});
  const browserFrame=await driver.executeScript('return {width:outerWidth-innerWidth,height:outerHeight-innerHeight}');
  await driver.manage().window().setRect({width:1920+browserFrame.width,height:1080+browserFrame.height});
  assert.deepEqual(await driver.executeScript('return {width:innerWidth,height:innerHeight}'),{width:1920,height:1080});
  await driver.get(authUrl);
  const route={pageId:'industrial-consistency',datasetIds:catalogIds,batchId:initialJob.run_id};
  await driver.get(origin+'/?'+new URLSearchParams({iad:JSON.stringify(route)}));
  await driver.wait(until.elementLocated(By.css('input[aria-label="搜索作业"]')),30000);
  await driver.wait(()=>driver.executeScript(function(id){
    const grid=document.querySelector('.dc-conflict-grid[data-job-id="'+id+'"]');
    const images=grid?[...grid.querySelectorAll('img')]:[];
    return images.length===18&&images.every(image=>image.complete&&image.naturalWidth>0);
  },initialJob.run_id),30000);
  const onboarding=await driver.findElements(By.xpath('//button[normalize-space(.)="Configure later"]'));
  if(onboarding.length){
    await onboarding[0].click();
    await driver.wait(until.stalenessOf(onboarding[0]),10000);
  }
  for(let iteration=0;iteration<20;iteration++){
    const id=jobs[iteration%jobs.length];
    const result=await driver.executeAsyncScript(function(id,done){
      const started=performance.now();let settled=false,clickedAt=null;
      const deadline=setTimeout(()=>finish({error:'首页图像未在 15 秒内全部解码'}),15000);
      function finish(result){
        if(settled)return;settled=true;clearTimeout(deadline);
        const requests=performance.getEntriesByType('resource').filter(entry=>entry.startTime>=started&&entry.name.includes('/api/iad/'))
          .map(entry=>({path:new URL(entry.name).pathname,start_offset_ms:entry.startTime-started,
            duration_ms:entry.duration,transfer_bytes:entry.transferSize}));
        const finished=performance.now();
        done({...result,job_id:id,milliseconds:finished-started,click_offset_ms:clickedAt===null?null:clickedAt-started,
          click_to_paint_ms:clickedAt===null?null:finished-clickedAt,requests});
      }
      function inspect(){
        if(settled)return;
        const row=document.querySelector('tr[data-run-id="'+id+'"]');
        if(clickedAt===null&&row){clickedAt=performance.now();row.querySelector('td').click();}
        const grid=document.querySelector('.dc-conflict-grid[data-job-id="'+id+'"]');
        const images=grid?[...grid.querySelectorAll('img')]:[];
        if(clickedAt!==null&&images.length===18&&images.every(image=>image.complete&&image.naturalWidth>0)){
          Promise.all(images.map(image=>image.decode())).then(()=>{
            requestAnimationFrame(()=>requestAnimationFrame(()=>
              finish({decoded_images:images.length,grid_job_id:grid.dataset.jobId})));
          },error=>finish({error:String(error)}));
        }else requestAnimationFrame(inspect);
      }
      const search=document.querySelector('input[aria-label="搜索作业"]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(search,id);
      search.dispatchEvent(new Event('input',{bubbles:true}));
      requestAnimationFrame(inspect);
    },id);
    measurements.push({iteration,...result});
    if(iteration<jobs.length)await fs.writeFile(path.join(root,`${id}-first-page.png`),await driver.takeScreenshot(),'base64');
    measurements.at(-1).after_capture=await driver.executeScript(function(){
      return {grid_job_id:document.querySelector('.dc-conflict-grid')?.dataset.jobId,
        selected_run_id:document.querySelector('tr[data-run-id][aria-selected="true"]')?.dataset.runId,
        search:document.querySelector('input[aria-label="搜索作业"]')?.value};
    });
  }
  const times=measurements.map(value=>value.milliseconds).sort((a,b)=>a-b);
  const proof={viewport:await driver.executeScript('return {width:innerWidth,height:innerHeight}'),
    http_cache:false,trigger:'搜索及点击之前开始计时',initial_job_id:initialJob.run_id,
    initial_job_dataset_ids:initialJob.dataset_ids,initial_job_uses_other_datasets:true,
    jobs:summaries.map(({run_id,total_samples,status})=>({run_id,total_samples,status})),
    measurements,max_ms:Math.max(...times),p95_ms:times[Math.ceil(times.length*.95)-1]};
  await fs.writeFile(path.join(root,'browser-performance.json'),JSON.stringify(proof,null,2));
  console.log(JSON.stringify({jobs:proof.jobs,max_ms:proof.max_ms,p95_ms:proof.p95_ms,iterations:measurements.length}));
  assert.ok(measurements.every(value=>!value.error&&value.milliseconds<=3000&&value.after_capture.grid_job_id===value.job_id),
    JSON.stringify(measurements.filter(value=>value.error||value.milliseconds>3000||value.after_capture.grid_job_id!==value.job_id)));
}catch(error){
  await fs.writeFile(path.join(root,'failure.png'),await driver.takeScreenshot(),'base64');
  throw error;
}finally{await driver.quit();}

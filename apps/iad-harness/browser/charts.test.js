import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge,findWorkspaceRoot} from '../lib/server/python-bridge/index.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('all chart surfaces use real aggregates with filtering theme changes keyboard actions and offline rendering',{timeout:120000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-chart-browser-'));
  const evidence=process.env.IAD_CHART_EVIDENCE_DIR||root;await fs.mkdir(evidence,{recursive:true});
  const bridge=new PythonBridge({cwd:findWorkspaceRoot(),dbPath:path.join(root,'charts.db')});
  let driver,server;
  try {
    const fixture=JSON.parse(execFileSync(bridge.pythonPath,[path.join(app,'browser/fixtures/chart-dataset.py'),root],{
      cwd:findWorkspaceRoot(),env:{...process.env,PYTHONPATH:path.join(findWorkspaceRoot(),'python')},encoding:'utf8'}));
    const report=await bridge.execute('audit_job_report',{run_id:fixture.run_id});
    const bundle=await build({stdin:{contents:`
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import {AuditReportContent} from './src/client/components/AuditReportContent.tsx';
import {ConsistencyStatisticsDialog} from './src/client/components/ConsistencyStatisticsDialog.tsx';
import {workbenchStyles} from './src/client/styles.ts';
function App(){const [dialog,setDialog]=useState('');const [statistics,setStatistics]=useState();
async function open(kind){const response=await fetch('/api/iad/consistency/gallery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query_id:window.fixture.query_id,kind:'conflicts',page_size:1})});setStatistics((await response.json()).statistics);setDialog(kind);}
return <><style>{workbenchStyles}</style><main className="iad-workbench" id="audit-page"><button id="open-statistics" onClick={()=>open('filter')}>冲突统计</button><button id="open-source-statistics" onClick={()=>open('source')}>来源统计</button><span id="selected-filter"/>
<section id="audit-report" style={{width:960,maxWidth:'100%'}}><AuditReportContent report={window.report} imageUrl={()=>''}/></section>
{dialog&&<ConsistencyStatisticsDialog statistics={statistics} onClose={()=>setDialog('')} onFilter={dialog==='filter'?(action,id)=>{document.getElementById('selected-filter').textContent=action+':'+id;}:undefined}/>}</main></>};
createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,write:false,format:'iife',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
    const handler=createIadHttpHandler(bridge);
    server=http.createServer((req,res)=>{
      if(req.url.startsWith('/api/iad/'))return void handler(req,res);
      if(req.url==='/page.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].contents);}
      res.setHeader('Content-Type','text/html; charset=utf-8');
      res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}#root{min-width:0}</style><script>window.browserErrors=[];addEventListener("error",event=>browserErrors.push(event.message));window.fixture='+JSON.stringify(fixture)+';window.report='+JSON.stringify(report)+'</script><div id="root"></div><script src="/page.js"></script>');
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(new firefox.Options()
      .addArguments('-headless','--remote-allow-system-access').setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox'))
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await driver.manage().window().setRect({width:1440,height:1080});
    const element=css=>driver.wait(until.elementLocated(By.css(css)),10000);
    const click=async css=>{const item=await element(css);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',item);await item.click();};
    const toggleSubset=async(id,value)=>{
      const chart=`[data-chart="${id}"]`;
      await click(`${chart} button[aria-label="选择子数据集"]`);
      await click(`${chart} input[type="checkbox"][value="${value}"]`);
      await click(`${chart} button[aria-label="选择子数据集"]`);
    };
    const readings=async id=>(await element(`[data-chart="${id}"] .iad-chart-plot`)).getAttribute('aria-label');
    await driver.get(`http://127.0.0.1:${server.address().port}/`);
    await element('[data-chart="image-dimensions"] .iad-chart-plot svg');
    const categoryPositions=await driver.executeScript(`return [...document.querySelectorAll('[data-chart="class-distribution"] svg text')]
      .filter(node=>arguments[0].includes(node.textContent)).map(node=>{const box=node.getBoundingClientRect();return {x:box.x,y:box.y};})`,report.data_distribution.slices[0].classes.map(row=>row.category));
    assert.equal(categoryPositions.length,2);
    assert.ok(Math.abs(categoryPositions[0].y-categoryPositions[1].y)<1&&Math.abs(categoryPositions[0].x-categoryPositions[1].x)>20,'类别应沿横轴排列，柱形向上显示');
    assert.equal(await driver.executeScript('return getComputedStyle(document.querySelector(".iad-chart-grid")).gridTemplateColumns.split(" ").length'),1,'图表应逐项纵向排列');
    assert.equal((await driver.findElements(By.css('.iad-chart table,.iad-chart details,.iad-chart summary'))).length,0,'图表不应附带重复表格或折叠区域');
    assert.match(await(await element('[data-chart="class-distribution"] .iad-chart-plot')).getAttribute('aria-label'),/图像（张）：4/);
    assert.equal(await driver.executeScript('return getComputedStyle(document.querySelector("[data-consistency-definitions=scope] thead")).backgroundColor'),'rgb(241, 244, 249)','必要的释义表保留浅灰表头');
    assert.equal(await driver.executeScript('return getComputedStyle(document.querySelector("[data-consistency-definitions=scope] td")).textAlign'),'left');
    const distribution='[data-report-section="distribution"]';
    assert.equal((await driver.findElements(By.css(`${distribution} table`))).length,0,'数据分布以图表展示');
    assert.match(await(await element(`${distribution} .iad-distribution-summary`)).getText(),/图像 6 张/);
    assert.match(await(await element(`${distribution} .iad-distribution-summary`)).getText(),/原始标注框 7 个/);
    assert.equal((await driver.findElements(By.css(`${distribution} [data-chart-type="heatmap"] .iad-chart-plot svg`))).length,3);
    assert.equal((await driver.findElements(By.css(`${distribution} button[aria-label="选择子数据集"]`))).length,
      (await driver.findElements(By.css(`${distribution} .iad-chart`))).length,'每张图都有独立子数据集勾选');
    assert.equal((await driver.findElements(By.css(`${distribution} select`))).length,0,'没有类别、单位或密度切换');
    for(const id of ['image-aspect-ratio','box-aspect-ratio','relative-area']){
      assert.equal(await(await element(`[data-chart="${id}"]`)).getAttribute('data-chart-type'),'distribution');
      assert.match(await readings(id),/数量（[张个]）：\d+，占比：[\d.]+%/);
      assert.doesNotMatch(await readings(id),/概率密度/);
      assert.ok(await driver.executeScript('return [...document.querySelectorAll(arguments[0])].some(node=>node.textContent==="样本占比")',`[data-chart="${id}"] svg text`));
    }
    assert.match(await readings('box-aspect-ratio'),/数量（个）：2，占比：100%/,'恒定长宽比按真实区间占比绘图');
    assert.match(await readings('box-dimensions'),/框宽（像素）/);
    assert.doesNotMatch(await readings('box-centers'),/%/,'框中心坐标以0–1小数朗读');
    const centerPlot=await element('[data-chart="box-centers"] .iad-chart-plot');
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',centerPlot);
    const centerLabels=await driver.executeScript('return [...arguments[0].querySelectorAll("svg text")].map(node=>node.textContent).join(" ")',centerPlot);
    assert.match(centerLabels,/0\.\d+/,'框中心坐标轴显示归一化小数');
    assert.doesNotMatch(centerLabels,/%/);
    await driver.actions().move({origin:centerPlot}).perform();
    await driver.wait(()=>driver.executeScript(`return [...document.querySelectorAll('[data-chart="box-centers"] svg text')]
      .some(node=>node.textContent.includes('水平位置 0.'));`),5000,'框中心悬浮提示显示小数区间');
    const centerTooltip=await driver.executeScript('return [...arguments[0].querySelectorAll("svg text")].map(node=>node.textContent).join(" ")',centerPlot);
    assert.match(centerTooltip,/垂直位置 0\.\d+/);
    assert.doesNotMatch(centerTooltip,/%/);
    await fs.writeFile(path.join(evidence,'center-decimal.png'),await driver.takeScreenshot(),'base64');
    const heatmapColors=await driver.executeScript(`return [...document.querySelectorAll('[data-report-section="distribution"] [data-chart-type="heatmap"]')].map(figure=>{
      const counts=new Map();for(const path of figure.querySelectorAll('svg path')){
        const fill=getComputedStyle(path).fill;if(fill.startsWith('rgb('))counts.set(fill,(counts.get(fill)||0)+1);
      }
      return {id:figure.dataset.chart,background:[...counts].sort((a,b)=>b[1]-a[1])[0][0],colors:[...counts.keys()]};
    });`);
    for(const heatmap of heatmapColors){
      assert.equal(heatmap.background,'rgb(49, 54, 149)',`${heatmap.id}的空区间使用官方示例默认低值色`);
      assert.ok(heatmap.colors.includes('rgb(165, 0, 38)'),`${heatmap.id}的最大数量使用深红色`);
    }
    const heatmapLayout=await driver.executeScript(`const plot=document.querySelector('[data-chart="image-dimensions"] .iad-chart-plot'),bounds=plot.getBoundingClientRect(),figure=plot.closest('figure').getBoundingClientRect();
      const legend=[...plot.querySelectorAll('svg text')].find(node=>node.textContent==='数量').getBoundingClientRect();
      return {height:bounds.height,width:bounds.width,center:bounds.x+bounds.width/2,figureCenter:figure.x+figure.width/2,legendRight:legend.left>bounds.right-90,
        heights:[...document.querySelectorAll('[data-report-section="distribution"] .iad-chart-plot')].map(node=>node.getBoundingClientRect().height),
        labels:[...plot.querySelectorAll('svg text')].filter(node=>node.textContent.includes('像素')).map(node=>{
        const b=node.getBoundingClientRect();return {text:node.textContent,contained:b.left>=bounds.left-1&&b.top>=bounds.top-1&&b.right<=bounds.right+1&&b.bottom<=bounds.bottom+1};})};`);
    assert.ok(heatmapLayout.heights.every(height=>Math.abs(height-480)<1),`桌面图高统一为480像素：${JSON.stringify(heatmapLayout)}`);
    assert.ok(Math.abs(heatmapLayout.width-640)<1,'热图宽度为640像素');
    assert.ok(Math.abs(heatmapLayout.width/heatmapLayout.height-4/3)<.01,'热图保持4:3比例');
    assert.ok(Math.abs(heatmapLayout.center-heatmapLayout.figureCenter)<1,'热图居中');
    assert.equal(heatmapLayout.legendRight,true,'热图数量图例在右侧');
    assert.equal(heatmapLayout.labels.length,2);
    assert.ok(heatmapLayout.labels.every(label=>label.contained),'宽高坐标轴标题应完整显示');
    await driver.executeScript('document.querySelector("[data-report-section=distribution]").scrollIntoView()');
    await fs.writeFile(path.join(evidence,'distribution-overview.png'),await driver.takeScreenshot(),'base64');
    const imageReadings=await readings('image-dimensions');
    await toggleSubset('class-distribution',fixture.dataset_ids[0]);
    assert.match(await readings('class-distribution'),/edge，图像（张）：2，标注框（个）：2/);
    assert.doesNotMatch(await readings('class-distribution'),/hole/);
    assert.equal(await readings('image-dimensions'),imageReadings,'类别图的子数据集筛选不影响宽高图');
    await toggleSubset('box-dimensions',fixture.dataset_ids[1]);
    const selectedBoxes=[...(await readings('box-dimensions')).matchAll(/数量：([\d,]+)/g)].reduce((sum,match)=>sum+Number(match[1].replaceAll(',','')),0);
    assert.equal(selectedBoxes,5);
    assert.match(await readings('class-distribution'),/edge，图像（张）：2，标注框（个）：2/,'框图筛选独立于类别图');
    await toggleSubset('class-distribution',fixture.dataset_ids[1]);
    assert.match(await(await element('[data-chart="class-distribution"] [role="status"]')).getText(),/请选择子数据集/);
    assert.equal((await driver.findElements(By.css('[data-chart="class-distribution"] .iad-chart-plot svg'))).length,0);
    assert.equal(await readings('image-dimensions'),imageReadings);
    await toggleSubset('class-distribution',fixture.dataset_ids[0]);
    await element('[data-chart="class-distribution"] .iad-chart-plot svg');
    assert.match(await readings('class-distribution'),/edge，图像（张）：2，标注框（个）：3/);
    await toggleSubset('class-distribution',fixture.dataset_ids[1]);
    await toggleSubset('box-dimensions',fixture.dataset_ids[1]);
    await element('[data-chart="box-aspect-ratio"] .iad-chart-plot svg');
    await fs.writeFile(path.join(evidence,'distribution-desktop.png'),await driver.takeScreenshot(),'base64');
    const curve=await element('[data-chart="relative-area"] .iad-chart-plot');
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',curve);
    await driver.actions().move({origin:curve}).perform();
    await driver.wait(()=>driver.executeScript(`const text=[...document.querySelectorAll('[data-chart="relative-area"] svg text')].map(node=>node.textContent).join(' ');
      return text.includes('数量（个）')&&text.includes('占比：');`),5000,'曲线悬浮提示应显示真实数量和占比');
    await fs.writeFile(path.join(evidence,'percent-curve.png'),await driver.takeScreenshot(),'base64');

    await driver.executeScript('document.body.setAttribute("data-ds-dark-theme","")');
    await click('#open-statistics');await element('dialog [data-chart="stat-category"] svg');
    assert.equal((await driver.findElements(By.css('dialog .iad-chart'))).length,3);
    const colors=await driver.executeScript('const s=getComputedStyle(document.querySelector("dialog .iad-chart-plot"));return {ink:s.getPropertyValue("--iad-chart-ink").trim(),primary:s.getPropertyValue("--iad-chart-primary").trim()};');
    assert.equal(colors.ink,'#EDF2F8');
    assert.equal(await driver.executeScript('return getComputedStyle(document.querySelector("dialog")).backgroundColor'),'rgb(32, 43, 58)','弹窗表面与深色图表应采用同一主题');
    assert.equal(await driver.executeScript('return getComputedStyle(document.querySelector("dialog .iad-chart figcaption")).color'),'rgb(237, 242, 248)','图表标题应使用深色主题文字颜色');
    const bar=await driver.executeScript(`return [...document.querySelectorAll('dialog [data-chart="stat-category"] svg path')].find(node=>node.getAttribute('fill')===arguments[0]&&node.getBoundingClientRect().width>5&&node.getBoundingClientRect().height>5)`,colors.primary);
    assert.ok(bar,'分类图应有实际数据条形');
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',bar);
    await driver.actions().move({origin:bar}).click().perform();
    await driver.wait(async()=>(await(await element('#selected-filter')).getText()).startsWith('stat-category:'),5000);
    await driver.executeScript('document.getElementById("selected-filter").textContent=""');
    const keyboard=await element('select[aria-label="按统计结果筛选"]');
    await keyboard.sendKeys(Key.ARROW_DOWN);
    await driver.wait(async()=>(await(await element('#selected-filter')).getText()).startsWith('stat-category:'),5000);
    await fs.writeFile(path.join(evidence,'consistency-dark.png'),await driver.takeScreenshot(),'base64');
    await click('button[aria-label="关闭标注冲突统计"]');await click('#open-source-statistics');
    await element('dialog [data-chart="stat-agreement"][data-chart-type="donut"] svg');
    assert.equal((await driver.findElements(By.css('select[aria-label="按统计结果筛选"]'))).length,0);
    const zeroSectors=await driver.executeScript(`return [...document.querySelectorAll('dialog [data-chart="stat-agreement"] svg path')].filter(node=>{
      const box=node.getBoundingClientRect();return box.width>40&&box.height>40&&[arguments[0],arguments[1]].includes(node.getAttribute('fill'));
    }).length`,colors.primary,await driver.executeScript('return getComputedStyle(document.querySelector("dialog .iad-chart-plot")).getPropertyValue("--iad-chart-success").trim()'));
    assert.equal(zeroSectors,0,'零值占比不能绘制等分扇区');
    await click('button[aria-label="关闭标注冲突统计"]');
    await driver.executeScript('document.body.removeAttribute("data-ds-dark-theme")');
    await driver.setContext('chrome');await driver.executeScript("gBrowser.selectedBrowser.style.width='390px';gBrowser.selectedBrowser.style.maxWidth='390px';gBrowser.selectedBrowser.style.flex='none'");await driver.setContext('content');
    await driver.wait(()=>driver.executeScript('return document.documentElement.scrollWidth<=innerWidth+1'),5000);
    assert.equal(await driver.executeScript('return getComputedStyle(document.querySelector(".iad-chart-grid")).gridTemplateColumns.split(" ").length'),1);
    const heatmapHeight=await driver.executeScript('return document.querySelector("[data-chart=image-dimensions]").getBoundingClientRect().height');
    for(const id of fixture.dataset_ids)await toggleSubset('image-dimensions',id);
    assert.ok(Math.abs(await driver.executeScript('return document.querySelector("[data-chart=image-dimensions]").getBoundingClientRect().height')-heatmapHeight)<1,'窄屏清空热图仍保持占位高度');
    for(const id of fixture.dataset_ids)await toggleSubset('image-dimensions',id);
    await driver.executeScript('document.querySelector("[data-report-section=distribution]").scrollIntoView()');
    await fs.writeFile(path.join(evidence,'distribution-mobile.png'),await driver.takeScreenshot(),'base64');
    assert.deepEqual(await driver.executeScript('return window.browserErrors'),[]);

    const exported=await bridge.execute('audit_job_export',{run_id:fixture.run_id});
    const file=path.join(root,'report.html');await fs.writeFile(file,exported.html);
    await fs.writeFile(path.join(evidence,'report.html'),exported.html);
    await driver.get(pathToFileURL(file).href);await element('[data-chart="image-dimensions"] .iad-chart-plot svg');
    assert.match(await(await element(`${distribution} .iad-distribution-summary`)).getText(),/原始标注框 7 个/);
    await toggleSubset('class-distribution',fixture.dataset_ids[0]);
    assert.match(await readings('class-distribution'),/edge，图像（张）：2，标注框（个）：2/);
    assert.equal(await readings('image-dimensions'),imageReadings);
    assert.equal((await driver.findElements(By.css(`${distribution} select`))).length,0);
    await element('[data-chart="relative-area"][data-chart-type="distribution"] .iad-chart-plot svg');
    assert.doesNotMatch(await readings('box-centers'),/%/,'离线报告使用相同的小数坐标');
    assert.equal(await driver.executeScript('return performance.getEntriesByType("resource").filter(entry=>/^https?:/.test(entry.name)).length'),0);
    await fs.writeFile(path.join(evidence,'offline-mobile.png'),await driver.takeScreenshot(),'base64');
    await fs.writeFile(path.join(evidence,'proof.json'),JSON.stringify({images:6,boxes:7,statistics:fixture.statistics,theme:colors,heatmaps:heatmapColors,offlineNetworkRequests:0},null,2));
  }finally{
    await driver?.quit();bridge.destroy();
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    await fs.rm(root,{recursive:true,force:true});
  }
});

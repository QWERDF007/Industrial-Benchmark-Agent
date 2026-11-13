import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import chrome from 'selenium-webdriver/chrome.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('subset popovers stay anchored without scrolling the page or its containing panel',{timeout:60000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-multiselect-'));
  const evidence=process.env.IAD_SELECT_EVIDENCE_DIR||root;await fs.mkdir(evidence,{recursive:true});
  let driver;
  try{
    const bundle=await build({stdin:{contents:`
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import {MultiSelect} from './src/client/components/Select.tsx';
import {Chart} from './src/client/components/charts/Chart.tsx';
import {workbenchStyles} from './src/client/styles.ts';
const spec={type:'bar',series:[{label:'图像',unit:'张'}],rows:[{id:'edge',label:'边缘',values:[4]}]};
function Plot({id,count}){const [selected,setSelected]=useState(['0']);return <Chart id={id} title="类别分布" spec={selected.length?spec:null} controls={<MultiSelect id={id} menuId={id+'-menu'} label="子数据集"
 options={Array.from({length:count},(_,i)=>({value:String(i),label:'采集批次 '+i+' 的子数据集'}))} selected={selected}
 onToggle={id=>setSelected(values=>values.includes(id)?values.filter(value=>value!==id):[...values,id])}/>}/>;}
createRoot(document.getElementById('root')).render(<><style>{workbenchStyles}</style><main className="iad-workbench" style={{padding:24}}>
<div style={{height:900}}/><Plot id="small-trigger" count={2}/>
<div style={{height:900}}/><Plot id="long-trigger" count={40}/>
<div id="nested" style={{height:500,overflow:'auto',marginTop:900}}><div style={{height:900}}/>
<Plot id="nested-trigger" count={40}/><div style={{height:900}}/></div>
<div style={{height:900}}/></main></>);`,loader:'tsx',resolveDir:app},bundle:true,write:false,format:'iife',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
    const file=path.join(root,'page.html');await fs.writeFile(file,'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}</style><div id="root"></div><script>'+bundle.outputFiles[0].text+'</script>');
    const browser=process.env.IAD_BROWSER||'firefox';
    const builder=new Builder().forBrowser(browser);
    if(browser==='chrome'){
      const options=new chrome.Options().addArguments('--headless=new','--no-sandbox','--disable-dev-shm-usage');
      if(process.env.CHROME_PATH)options.setChromeBinaryPath(process.env.CHROME_PATH);
      builder.setChromeOptions(options);
      if(process.env.CHROMEDRIVER_PATH)builder.setChromeService(new chrome.ServiceBuilder(process.env.CHROMEDRIVER_PATH));
    }
    else builder.setFirefoxOptions(new firefox.Options().addArguments('-headless','--remote-allow-system-access')
      .setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox')).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver'));
    driver=await builder.build();
    await driver.manage().window().setRect({width:1440,height:1000});
    await driver.get(pathToFileURL(file).href);
    await driver.wait(until.elementLocated(By.css('[data-chart="small-trigger"] .iad-chart-plot svg')),10000);
    const measurements=[];
    for(const id of ['small-trigger','long-trigger','nested-trigger'])for(const edge of ['top','bottom']){
      const trigger=await driver.findElement(By.id(id));
      await driver.executeScript(`const trigger=arguments[0],edge=arguments[1];trigger.scrollIntoView({block:'center'});
        if(trigger.closest('#nested')){const scroller=document.getElementById('nested');scroller.scrollTop+=trigger.getBoundingClientRect().top-scroller.getBoundingClientRect().top-80;}
        else window.scrollBy(0,trigger.getBoundingClientRect().top-(edge==='top'?40:innerHeight-100));`,trigger,edge);
      for(let repeat=0;repeat<2;repeat++){
        await driver.executeScript(`const trigger=arguments[0],panel=document.getElementById(trigger.getAttribute('aria-controls'));
          const scrolls=()=>[window.scrollY,document.getElementById('nested').scrollTop];
          window.pickerTrace={before:scrolls(),chartHeight:trigger.closest('figure').getBoundingClientRect().height,frames:[],active:true};
          const sample=()=>{const trace=window.pickerTrace;if(!trace.active)return;
            const rect=panel.getBoundingClientRect(),anchor=trigger.getBoundingClientRect();
            if(panel.matches(':popover-open')&&getComputedStyle(panel).visibility==='visible')
              trace.frames.push({x:rect.x,y:rect.y,width:rect.width,height:rect.height,anchorY:anchor.y,scrolls:scrolls()});
            requestAnimationFrame(sample);};requestAnimationFrame(sample);`,trigger);
        await driver.actions().move({origin:trigger}).click().perform();
        await driver.wait(()=>driver.executeScript('return !!document.querySelector(".iad-select-popover:popover-open")'),5000);
        const trace=await driver.executeAsyncScript(`const done=arguments[arguments.length-1];let frames=0;
          const next=()=>{if(++frames<20)return requestAnimationFrame(next);const trace=window.pickerTrace;trace.active=false;done(trace);};requestAnimationFrame(next);`);
        measurements.push({id,edge,repeat,...trace});
        assert.ok(trace.frames.length>1,'下拉选项应正常显示');
        assert.ok(trace.frames.every(frame=>frame.scrolls.every((value,index)=>Math.abs(value-trace.before[index])<=1)),`打开下拉列表不应改变页面滚动位置：${JSON.stringify(measurements.at(-1))}`);
        for(const key of ['x','y','width','height'])assert.ok(Math.max(...trace.frames.map(frame=>frame[key]))-Math.min(...trace.frames.map(frame=>frame[key]))<=1,`下拉列表不应跳动：${JSON.stringify(measurements.at(-1))}`);
        const input=await driver.findElement(By.css(`#${id}-menu input`));
        await driver.actions().move({origin:input}).click().perform();
        await driver.actions().sendKeys(Key.ESCAPE).perform();
        const after=await driver.executeScript('return [window.scrollY,document.getElementById("nested").scrollTop]');
        assert.deepEqual(after,trace.before,'勾选并关闭下拉列表不应跳转页面');
        assert.ok(Math.abs(await driver.executeScript('return arguments[0].closest("figure").getBoundingClientRect().height',trigger)-trace.chartHeight)<=1,'清空和恢复子数据集时图表占位高度应稳定');
      }
    }
    await fs.writeFile(path.join(evidence,'measurements.json'),JSON.stringify(measurements,null,2));
    await fs.writeFile(path.join(evidence,'picker.png'),await driver.takeScreenshot(),'base64');
  }catch(error){if(driver)await fs.writeFile(path.join(evidence,'failure.png'),await driver.takeScreenshot(),'base64');throw error;}
  finally{await driver?.quit();await fs.rm(root,{recursive:true,force:true});}
});

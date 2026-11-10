import {selectModuleModel} from './module-model-select.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder, By, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {Select as NativeSelect} from 'selenium-webdriver/lib/select.js';
import {PythonBridge} from '../lib/server/python-bridge/index.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';

for(const module of ['consistency','exploration','knowledge'])test(`${module} settings persist independent module values through the original controls`, {timeout:45000}, async()=>{
  const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-consistency-settings-'));
  const bridge = new PythonBridge({cwd: path.resolve(app, '../..'), dbPath: path.join(root, 'test.db')});
  const bundle = await build({stdin: {contents: `import React from 'react';import {createRoot} from 'react-dom/client';
import {QueryClientProvider} from '@tanstack/react-query';import {queryClient} from './src/client/query-client.ts';
import {ModuleSettingsSection} from './src/client/components/ModuleSettingsSection.tsx';

import {workbenchStyles} from './src/client/styles.ts';
createRoot(document.getElementById('root')).render(<QueryClientProvider client={queryClient}><div className="iad-workbench"><style>{workbenchStyles}</style><ModuleSettingsSection module={${JSON.stringify(module)}}/></div></QueryClientProvider>);`,
    loader: 'tsx', resolveDir: app}, bundle: true, format: 'iife', write: false, target: 'es2022', define: {'process.env.NODE_ENV': '"production"'}});
  const handler = createIadHttpHandler(bridge);
  const server = http.createServer(async (req, res) => {
    if (req.url === '/browser.js') {res.setHeader('Content-Type', 'application/javascript');res.end(bundle.outputFiles[0].contents);return;}
    if (req.url === '/') {res.setHeader('Content-Type', 'text/html;charset=utf-8');res.end('<meta charset="utf-8"><div id="root"></div><script src="/browser.js"></script>');return;}
    if (req.url === '/api/iad/models/providers') {res.setHeader('Content-Type', 'application/json');res.end(JSON.stringify({providers: [{provider_id: 'local', name: 'Local', models: [
      {model_id: 'vision', name: 'Vision', input_modalities: ['text', 'image']}, {model_id: 'planner', name: 'Planner', input_modalities: ['text']},
    ]}]}));return;}
    await handler(req, res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let driver;
  try {
    const options = new firefox.Options().addArguments('-headless', '--remote-allow-system-access');
    if (process.env.FIREFOX_PATH) options.setBinary(process.env.FIREFOX_PATH);
    driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options)
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || '/tmp/geckodriver')).build();
    await driver.get(base);
    const field = label => driver.findElement(By.css(`input[aria-label="${label}"]`));
    if(module!=='consistency') {
      await driver.manage().window().setRect({width:1920,height:1080});
      await driver.wait(until.elementLocated(By.css('input[aria-label="良品抽取权重"]')),5000);
      assert.equal(await(await field('良品抽取权重')).getAttribute('value'),'1');
      assert.equal(await(await field('异常品抽取权重')).getAttribute('value'),'1');
      const read=async name=>(await(await fetch(base+'/api/iad/settings/modules/'+name)).json());
      const normal=await field('良品抽取权重');await normal.clear();await normal.sendKeys('3');await driver.findElement(By.css('h2')).click();
      await driver.wait(async()=>(await read(module)).settings.sampling_ratio.normal===3,5000);
      const abnormal=await field('异常品抽取权重');await abnormal.clear();await abnormal.sendKeys('2');await driver.findElement(By.css('h2')).click();
      await driver.wait(async()=>(await read(module)).settings.sampling_ratio.abnormal===2,5000);
      const saved=await read(module);
      assert.deepEqual(saved.settings.sampling_ratio,{normal:3,abnormal:2});
      const other=await read(module==='exploration'?'knowledge':'exploration');
      assert.equal(other.revision,0);assert.deepEqual(other.settings.sampling_ratio,{normal:1,abnormal:1});
      await abnormal.clear();await abnormal.sendKeys('0');await driver.findElement(By.css('h2')).click();
      await driver.wait(until.elementLocated(By.css('input[aria-label="异常品抽取权重"][aria-invalid="true"]')),5000);
      assert.deepEqual(await read(module),saved);
      await driver.navigate().refresh();
      await driver.wait(until.elementLocated(By.css('input[aria-label="良品抽取权重"]')),5000);
      assert.equal(await(await field('良品抽取权重')).getAttribute('value'),'3');
      assert.equal(await(await field('异常品抽取权重')).getAttribute('value'),'2');
      await fs.writeFile('/tmp/'+module+'-sampling-settings-browser.png',await driver.takeScreenshot(),'base64');
      return;
    }
    await driver.wait(until.elementLocated(By.css('input[aria-label="相似度阈值"]')), 5000);
    assert.equal(await (await field('相似度阈值')).getAttribute('value'), '0.98');
    assert.equal(await (await field('完全一致图上限')).getAttribute('value'), '5');
    assert.equal(await (await field('相似图上限')).getAttribute('value'), '10');
    const change = async (label, value) => {const input = await field(label);await input.clear();await input.sendKeys(value);await driver.findElement(By.css('h2')).click();};
    assert.equal(await (await field('同时检查的主图数')).getAttribute('value'), '1');
    await change('同时检查的主图数', '3');
    await driver.wait(async () => (await (await fetch(base + '/api/iad/settings/modules/consistency')).json()).settings.concurrency === 3, 5000);
    await change('同时检查的主图数', '0');
    await driver.wait(until.elementLocated(By.css('input[aria-label="同时检查的主图数"][aria-invalid="true"]')), 5000);
    assert.equal((await (await fetch(base + '/api/iad/settings/modules/consistency')).json()).settings.concurrency, 3);
    await change('同时检查的主图数', '2');
    await driver.wait(async () => (await (await fetch(base + '/api/iad/settings/modules/consistency')).json()).settings.concurrency === 2, 5000);
    await change('完全一致图上限', '3');await change('相似图上限', '7');
    const read = async () => (await (await fetch(base + '/api/iad/settings/modules/consistency')).json()).settings;
    await driver.wait(async () => {const settings = await read();return settings.max_exact_candidates === 3 && settings.max_similar_candidates === 7;}, 5000);
    const select = async (label, text) => new NativeSelect(await driver.findElement(By.css(`select[aria-label="${label}"]`))).selectByVisibleText(text);
    assert.equal((await driver.findElements(By.css('select[aria-label="Agent 模型"]'))).length, 0);
    await selectModuleModel(driver,'Vision（Local）');
    await driver.wait(async () => (await read()).model?.model_id === 'vision', 5000);
    assert.equal(Object.hasOwn(await read(), 'agent_model'), false);
    await select('检索方式', '完全一致');
    assert.equal((await driver.findElements(By.css('input[aria-label="相似图上限"]'))).length, 0);
    assert.equal((await driver.findElements(By.css('input[aria-label="相似度阈值"]'))).length, 0);
    await driver.wait(async () => (await read()).mode === 'exact', 5000);
    await driver.navigate().refresh();
    await driver.wait(until.elementLocated(By.css('input[aria-label="完全一致图上限"]')), 5000);
    assert.equal(await (await field('同时检查的主图数')).getAttribute('value'), '2');
    assert.equal(await (await field('完全一致图上限')).getAttribute('value'), '3');
    await select('检索方式', '一致+相似');
    await driver.wait(until.elementLocated(By.css('input[aria-label="相似图上限"]')), 5000);
    assert.equal(await (await field('相似图上限')).getAttribute('value'), '7');
    await change('完全一致图上限', '0');
    await driver.wait(until.elementLocated(By.css('[role="alert"]')), 5000);
    assert.equal((await read()).max_exact_candidates, 3);
    await change('完全一致图上限', '4');
    await driver.wait(async () => (await read()).max_exact_candidates === 4, 5000);
    await fs.writeFile('/tmp/consistency-dsh-settings-browser.png', await driver.takeScreenshot(), 'base64');
  } catch (error) {
    if (driver) console.error(await driver.executeScript(`return {text:document.body.innerText, inputs:[...document.querySelectorAll('input')].map(input=>({label:input.getAttribute('aria-label'),value:input.value,min:input.min,valid:input.validity.valid}))}`));
    throw error;
  } finally {
    await driver?.quit();bridge.destroy();await new Promise(resolve => server.close(resolve));await fs.rm(root, {recursive: true, force: true});
  }
});

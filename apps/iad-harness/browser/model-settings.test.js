import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {Builder, By, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('authenticated LAN browser saves provider settings and switches models', {timeout: 90000}, async () => {
  const address = Object.values(os.networkInterfaces()).flat().find(item => item?.family === 'IPv4' && !item.internal)?.address;
  assert.ok(address, 'LAN interface required to exercise non-loopback browser settings');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-model-settings-'));
  const profile = path.join(root, 'home/profiles/web');
  await fs.mkdir(profile, {recursive: true});
  await fs.writeFile(path.join(profile, 'package.json'), JSON.stringify({name: 'iad-model-settings', private: true, type: 'module',
    dsh: {profile: {bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']}}}));
  await fs.writeFile(path.join(profile, 'cordis.yml'), '[]\n');
  const reservation = http.createServer();
  await new Promise(resolve => reservation.listen(0, '0.0.0.0', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const patch = path.join(root, 'host.patch.yml');
  await fs.writeFile(patch, `- id: webserver
  config:
    host: 0.0.0.0
    port: ${port}
`);
  await fs.writeFile(path.join(profile, 'cordis.patch.yml'), `- id: ui-settings-general
  config:
    welcomeNoticeVersion: 2026-09-28.1
- id: llm-pi-ai
  config:
    providers:
      first-service:
        displayName: First service
        api: openai-completions
        baseURL: http://127.0.0.1:30002/v1
        models:
          - id: first-model
            name: First model
            input: [text, image]
      second-service:
        displayName: Second service
        api: openai-completions
        baseURL: http://127.0.0.1:30003/v1
        models:
          - id: second-model
            name: Second model
            input: [text, image]
- id: agent-default-model
  config:
    provider: first-service
    model: first-model
`);
  const host = spawn(process.env.IAD_NODE_PATH || process.execPath,
    [path.join(workspace, 'node_modules/@deepseek-ai/dsh/lib/bin.js'), '--profile', 'web', '--patch', patch, '--port', String(port), '--no-open'],
    {cwd: workspace, env: {...process.env, DSH_HOME: path.join(root, 'home')}, stdio: ['ignore', 'pipe', 'pipe']});
  let log = '', driver, phase = 'startup';
  host.stdout.on('data', data => {log += data;}); host.stderr.on('data', data => {log += data;});
  try {
    const deadline = Date.now() + 30000;
    while (!log.match(/http:\/\/[^\s)]+/) && host.exitCode === null && Date.now() < deadline) await delay(100);
    const login = log.match(/http:\/\/[^\s)]+/)?.[0];
    assert.ok(login, log.replace(/(token=)[^\s&]+/g, '$1<redacted>'));
    const url = new URL(login); url.hostname = address;
    const options = new firefox.Options().addArguments('-headless');
    if (process.env.FIREFOX_PATH) options.setBinary(process.env.FIREFOX_PATH);
    driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options)
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || 'geckodriver')).build();
    await driver.manage().window().setRect({width: 1440, height: 1000});
    await driver.get(url.href);
    const click = async text => (await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${text}']`)), 15000)).click();
    const openModels = async () => {
      await driver.wait(async () => {
        const tabs = await driver.findElements(By.xpath("//button[normalize-space(.)='Models']"));
        if (tabs.length && await tabs[0].isDisplayed()) return true;
        for (const text of ['Configure later', 'Continue']) {
          const buttons = await driver.findElements(By.xpath(`//button[.='${text}']`));
          if (buttons.length && await buttons[0].isDisplayed()) await buttons[0].click();
        }
        const buttons = await driver.findElements(By.css('button[aria-label="Settings"]'));
        if (!buttons.length || !await buttons[0].isDisplayed()) return false;
        try {await buttons[0].click(); return false;}
        catch (error) {
          if (['ElementNotInteractableError', 'ElementClickInterceptedError'].includes(error.name)) return false;
          throw error;
        }
      }, 15000);
      await click('Models');
    };
    phase = 'open settings';
    await openModels();
    phase = 'load providers';
    await driver.wait(async () => {
      const text = await driver.findElement(By.css('body')).getText();
      assert.ok(!text.includes('settings are unavailable in this browser'), 'settings are unavailable in this browser');
      return text.includes('First service') && text.includes('Second service');
    }, 10000);
    await (await driver.findElement(By.css('button[aria-label^="Edit First service"]'))).click();
    await (await driver.findElement(By.xpath("//summary[normalize-space(.)='Customized settings']"))).click();
    const name = await driver.findElement(By.css('input[aria-label="Display name"]'));
    await name.clear(); await name.sendKeys('Renamed first service');
    await click('Apply');
    phase = 'save provider';
    await driver.wait(async () => (await driver.findElement(By.css('body')).getText()).includes('Renamed first service'), 10000);
    await driver.navigate().refresh();
    phase = 'reload settings';
    await openModels();
    await driver.wait(async () => (await driver.findElement(By.css('body')).getText()).includes('Renamed first service'), 10000);
    const close = await driver.findElements(By.css('button[aria-label="Close"],button[aria-label="Close settings"]'));
    if (close.length) await close[0].click(); else await driver.actions().sendKeys('\uE00C').perform();
    const selector = await driver.wait(until.elementLocated(By.css('button[aria-label^="Select model,"]')), 10000);
    await selector.click();
    phase = 'switch model';
    await (await driver.wait(until.elementLocated(By.xpath("//button[@role='menuitem'][starts-with(normalize-space(.),'Model')]")), 10000)).click();
    await click('Second model');
    await driver.wait(async () => (await selector.getAttribute('aria-label')).includes('Second model'), 10000);
  } catch (error) {
    if (driver) {
      console.error(phase + '\n' + (await driver.findElement(By.css('body')).getText()).slice(-4500));
      await fs.writeFile(path.join(os.tmpdir(), 'iad-model-settings-failure.png'), await driver.takeScreenshot(), 'base64');
    }
    console.error(log.slice(-3500).replace(/(token=)[^\s&]+/g, '$1<redacted>'));
    throw error;
  } finally {
    await driver?.quit(); host.kill('SIGTERM');
    await Promise.race([new Promise(resolve => host.once('exit', resolve)), delay(3000)]);
    if (host.exitCode === null) host.kill('SIGKILL');
    await fs.rm(root, {recursive: true, force: true});
  }
});

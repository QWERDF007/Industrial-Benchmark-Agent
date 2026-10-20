import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Builder, By, Key, until } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const log = process.env.IAD_WEB_URL ? "" : await fs.readFile(process.env.IAD_WEB_LOG || path.join(workspace, "runs/dsh_web.log"), "utf8");
const url = new URL(process.env.IAD_WEB_URL || log.match(/https?:\/\/[^\s)]+/)[0]);
if (!process.env.IAD_WEB_URL) url.hostname = "127.0.0.1";
const labels = ["数据集管理", "图像浏览", "挖掘良品知识", "挖掘不良品知识", "模型审计", "人工复核"];
const options = new firefox.Options().addArguments("-headless");
if (process.env.FIREFOX_PATH) options.setBinary(process.env.FIREFOX_PATH);
const driver = await new Builder().forBrowser("firefox").setFirefoxOptions(options)
  .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || "geckodriver")).build();
const output = process.env.IAD_BROWSER_OUTPUT || path.join(workspace, "runs/browser");
const verification = { navigation: labels, viewports: [], contrasts: [], defaultConversationPreserved: false };
try {
  await fs.mkdir(output, { recursive: true });
  await driver.manage().window().setRect({ width: 1600, height: 1000 });
  await driver.get(url.href);
  await driver.wait(until.elementLocated(By.css("button[aria-label='数据集管理']")), 20000);
  const configure = await driver.wait(until.elementLocated(By.xpath("//button[.='Configure later']")), 5000).catch(() => null);
  if (configure) await configure.click();
  const notice = await driver.wait(until.elementLocated(By.xpath("//button[.='Continue']")), 2000).catch(() => null);
  if (notice) await notice.click();
  assert.deepEqual(await driver.executeScript("return [...document.querySelectorAll('button')].map(b=>b.getAttribute('aria-label')).filter(x=>arguments[0].includes(x))", labels), labels);
  assert.equal((await driver.findElements(By.css(".iad-workbench"))).length, 0, "Do not replace the default DSH conversation on startup");
  verification.defaultConversationPreserved = true;
  const sidebar = async label => {
    await driver.findElement(By.css(`button[aria-label='${label}']`)).click();
    await driver.wait(async () => (await driver.findElement(By.css(".iad-workbench h1")).getText()) === label, 10000);
  };
  await sidebar("数据集管理");
  if (process.env.IAD_VERIFY_DATASET_ROOT) {
    await driver.findElement(By.xpath("//button[.='添加数据集']")).click();
    await driver.findElement(By.css("#dataset-name")).sendKeys("原生六页验收");
    for (const [label, directory] of [["图像目录", "images"], ["标注目录", "labels"]]) await driver.findElement(By.css(`input[aria-label='${label}']`)).sendKeys(path.join(process.env.IAD_VERIFY_DATASET_ROOT, directory));
    await driver.findElement(By.xpath("//button[.='导入数据集']")).click();
    await driver.wait(async () => (await driver.findElement(By.css("select[aria-label='当前数据集']")).getText()).includes("原生六页验收"), 15000);
  }
  for (const label of labels) {
    await sidebar(label);
    await fs.writeFile(path.join(output, `native-${labels.indexOf(label)}.png`), await driver.takeScreenshot(), "base64");
  }
  const verifyContrast = async () => {
    await driver.wait(until.elementLocated(By.css(".iad-reference")), 5000);
    const contrasts = await driver.executeScript(`
      const context=document.createElement('canvas').getContext('2d',{willReadFrequently:true});
      const luminance=color=>{context.clearRect(0,0,1,1);context.fillStyle=color;context.fillRect(0,0,1,1);
        const rgb=[...context.getImageData(0,0,1,1).data].slice(0,3).map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
        return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722};
      return ['.iad-workbench','.iad-kpis span','.iad-reference','.iad-badge'].map(selector=>{
        const element=document.querySelector(selector),style=getComputedStyle(element);
        const background=selector==='.iad-kpis span'?getComputedStyle(element.parentElement).backgroundColor:style.backgroundColor;
        const fg=luminance(style.color),bg=luminance(background);return {selector,ratio:(Math.max(fg,bg)+0.05)/(Math.min(fg,bg)+0.05)};
      });`);
    for(const {selector,ratio} of contrasts) assert.ok(ratio>=4.5, `${selector} text contrast ${ratio.toFixed(2)}`);
    verification.contrasts.push({ dark: await driver.executeScript("return document.body.hasAttribute('data-ds-dark-theme')"), values: contrasts });
  };
  await sidebar("图像浏览");
  await verifyContrast();
  await driver.findElement(By.xpath("//button[normalize-space(.)='Settings']")).click();
  await driver.wait(until.elementLocated(By.xpath("//button[normalize-space(.)='Dark']")), 10000).click();
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await sidebar("图像浏览");
  await driver.wait(async () => await driver.executeScript("return document.body.hasAttribute('data-ds-dark-theme')"), 5000);
  await fs.writeFile(path.join(output, "native-browse-dark.png"), await driver.takeScreenshot(), "base64");
  await verifyContrast();
  await driver.findElement(By.xpath("//button[normalize-space(.)='Settings']")).click();
  await driver.wait(until.elementLocated(By.xpath("//button[normalize-space(.)='Light']")), 10000).click();
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await sidebar("图像浏览");
  await driver.wait(until.elementLocated(By.css(".iad-grid img")), 15000);
  assert.equal((await driver.findElements(By.css(".iad-inspector"))).length, 0);
  await driver.findElement(By.css(".iad-grid img")).click();
  await driver.wait(until.elementLocated(By.css("dialog[open] .iad-inspector")), 5000);
  assert.equal((await driver.findElements(By.css(".iad-decision"))).length, 0);
  await driver.findElement(By.xpath("//button[.='返回图像浏览']")).click();
  for (const [width, height] of [[1920,1080],[1366,768],[1280,800],[375,812]]) {
    const chrome = await driver.executeScript("return {width:outerWidth-innerWidth,height:outerHeight-innerHeight}");
    await driver.manage().window().setRect({ width: width+chrome.width, height: height+chrome.height });
    if (width === 375) {
      await driver.setContext("chrome");
      await driver.executeScript("gBrowser.selectedBrowser.style.maxWidth='375px';gBrowser.selectedBrowser.style.width='375px';gBrowser.selectedBrowser.style.flex='none'");
      await driver.setContext("content");
    }
    await driver.sleep(100);
    const viewport = await driver.executeScript("return {width:innerWidth,height:innerHeight}");
    assert.deepEqual(viewport, { width, height }, "Use the actual CSS viewport dimensions");
    verification.viewports.push(viewport);
    assert.ok(await driver.executeScript("const e=document.querySelector('.iad-workbench');return e.scrollWidth<=e.clientWidth+1"), `No page overflow at ${width}`);
    await fs.writeFile(path.join(output, `native-browse-${width}.png`), await driver.takeScreenshot(), "base64");
    await sidebar("数据集管理");
    await driver.wait(until.elementLocated(By.css(".iad-dataset-list button")), 10000);
    assert.ok(await driver.executeScript("const e=document.querySelector('.iad-workbench');return e.scrollWidth<=e.clientWidth+1"), `No manager overflow at ${width}`);
    await driver.findElement(By.xpath("//button[.='添加数据集']")).click();
    await driver.wait(until.elementLocated(By.css("dialog[open] #dataset-name")),5000);
    assert.ok(await driver.executeScript("const e=document.querySelector('dialog[open]');return e.scrollWidth<=e.clientWidth+1"), `No import form overflow at ${width}`);
    await fs.writeFile(path.join(output, `native-import-${width}.png`),await driver.takeScreenshot(),"base64");
    await driver.findElement(By.xpath("//button[.='取消']")).click();
    assert.equal(await driver.executeScript("return document.activeElement.textContent"),"添加数据集");
    await sidebar("图像浏览");
  }
  await driver.navigate().refresh();
  await driver.wait(until.elementLocated(By.css("[data-page='industrial-images'] .iad-grid img")), 15000);
  await fs.writeFile(path.join(output, "verification.json"), JSON.stringify(verification, null, 2));
  console.log("Native six-page navigation, directory import, read-only browsing, refresh and four viewport sizes verified");
} catch (error) {
  await fs.writeFile(path.join(output, "native-failure.png"), await driver.takeScreenshot(), "base64");
  throw error;
} finally {
  await driver.quit();
}

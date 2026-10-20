import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Builder, By, until } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const log = await fs.readFile(path.join(workspace, "runs/dsh_web.log"), "utf8");
const url = new URL(process.env.IAD_WEB_URL || log.match(/LAN: (http:\/\/[^\s)]+)/)[1]);
if (!process.env.IAD_WEB_URL) url.hostname = "127.0.0.1";
const options = new firefox.Options().addArguments("-headless");
if (process.env.FIREFOX_PATH) options.setBinary(process.env.FIREFOX_PATH);
const driver = await new Builder().forBrowser("firefox").setFirefoxOptions(options)
  .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || "geckodriver")).build();
try {
  await driver.manage().window().setRect({ width: 1600, height: 1100 });
  await driver.get(url.href);
  await driver.wait(until.elementLocated(By.css("button[aria-label='模型审计']")), 20000);
  const notice = await driver.wait(until.elementLocated(By.xpath("//button[.='Continue']")), 5000).catch(() => null);
  if (notice) await notice.click();
  const navigation = await driver.executeScript("return [...document.querySelectorAll('button')].map(b=>b.getAttribute('aria-label')).filter(x=>['Plugins','模型审计','人工复核'].includes(x));");
  assert.deepEqual(navigation, ["Plugins", "模型审计", "人工复核"]);
  await driver.findElement(By.css("button[aria-label='模型审计']")).click();
  await driver.wait(until.elementLocated(By.css(".iad-inspector .iad-image-frame img")), 15000);
  await driver.wait(async () => await driver.executeScript("return document.querySelector('.iad-thumb img')?.naturalWidth>0 && document.querySelector('.iad-inspector .iad-image-frame img')?.naturalWidth>0;"), 15000);
  assert.equal(await driver.findElement(By.css(".iad-workbench h1")).getText(), "模型审计");
  assert.equal((await driver.findElements(By.xpath("//h2[.='复核明细']"))).length, 0);
  const output = path.join(workspace, "runs/browser");
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, "dsh-model-audit.png"), await driver.takeScreenshot(), "base64");
  await driver.findElement(By.css("button[title='放大图像']")).click();
  const zoom = await driver.wait(until.elementLocated(By.css("select[aria-label='缩放']")), 5000);
  await driver.executeScript("arguments[0].value='2';arguments[0].dispatchEvent(new Event('change',{bubbles:true}));", zoom);
  assert.ok(await driver.executeScript("const v=document.querySelector('.iad-viewer-viewport').getBoundingClientRect(), i=document.querySelector('.iad-viewer-world').getBoundingClientRect();return Math.abs(v.x+v.width/2-i.x-i.width/2)<2 && Math.abs(v.y+v.height/2-i.y-i.height/2)<2;"));
  await driver.findElement(By.css("button[title='隐藏标注']")).click();
  assert.equal((await driver.findElements(By.css("[role='dialog'] .iad-annotation-layer"))).length, 0);
  await fs.writeFile(path.join(output, "dsh-image-viewer.png"), await driver.takeScreenshot(), "base64");
  await driver.findElement(By.xpath("//button[.='关闭']")).click();
  await driver.findElement(By.xpath("//button[.='模型审计作业']")).click();
  await driver.wait(until.elementLocated(By.xpath("//button[.='审计当前筛选全部图像']")), 5000);
  assert.equal((await driver.findElements(By.xpath("//label[contains(.,'最多审计图数') or contains(.,'每图 ROI 预算')]//input"))).length, 0);
  await driver.wait(until.elementLocated(By.css(".iad-reference-grid button")), 5000).click();
  await driver.wait(until.elementLocated(By.css(".iad-viewer-viewport img")), 5000);
  await driver.findElement(By.xpath("//button[.='关闭']")).click();
  await driver.findElement(By.css("button[aria-label='人工复核']")).click();
  await driver.wait(until.elementLocated(By.css(".iad-inspector .iad-decision")), 15000);
  assert.equal(await driver.findElement(By.css(".iad-workbench h1")).getText(), "人工复核");
  assert.equal(await driver.findElement(By.css(".iad-inspector h2")).getText(), "复核明细");
  assert.equal((await driver.findElements(By.css(".iad-tabs"))).length, 0);
  await fs.writeFile(path.join(output, "dsh-human-review.png"), await driver.takeScreenshot(), "base64");
  console.log("DSH sidebar order, native pages, real thumbnails, centered viewer, annotation visibility, reference preview and review details verified");
} finally {
  await driver.quit();
}

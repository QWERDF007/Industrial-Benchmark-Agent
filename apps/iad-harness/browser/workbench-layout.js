import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import axe from "axe-core";
import contrast from "wcag-contrast";
import { By, Key, until } from "selenium-webdriver";

const pages = ["数据集管理", "图像浏览", "挖掘良品知识", "挖掘不良品知识", "模型审计", "人工复核"];
const viewports = [[1920, 1080], [1366, 768], [1280, 800], [375, 812]];

/** Real host surfaces, browser text zoom and OS motion preference; no application state substitutes. */
export async function verifyWorkbenchLayout(driver, output) {
  output = path.join(output, String(Date.now()));
  await fs.mkdir(output, { recursive: true });
  console.log(JSON.stringify({ layoutEvidence: output }));
  await driver.executeScript(axe.source);
  const results = [], headings = new Map();
  const element = selector => driver.wait(until.elementLocated(By.css(selector)), 10000);
  for (const theme of ["Light", "Dark"]) {
    await setTheme(driver, theme);
    for (const zoom of [1, 2]) {
      await textZoom(driver, zoom);
      for (const [width, height] of viewports) {
        await viewport(driver, width, height);
        for (const [index, label] of pages.entries()) {
          const scope = { theme, zoom, width, height, page: label };
          const name = `${theme.toLowerCase()}-${zoom * 100}-${width}-${index}`;
          await (await element(`button[aria-label^='${label}']`)).click();
          await driver.wait(() => driver.executeScript("return document.querySelector('.iad-workbench h1')?.textContent===arguments[0]", label), 10000);
          if (label === "模型审计") await driver.findElement(By.xpath("//button[normalize-space(.)='结果']")).click();
          await driver.wait(() => driver.executeScript("const e=document.querySelector('.iad-workbench');return e.querySelector(arguments[0]==='数据集管理'?'.iad-settings':'.iad-kpis') && !e.textContent.includes('加载中…') && !e.textContent.includes('正在读取知识…')", label), 10000);
          if (label === "数据集管理") {
            assert.equal((await driver.findElements(By.css(".iad-header select,.iad-header button,.iad-kpis"))).length, 0, "数据集管理不重复显示全局选择与统计");
            const layout = await driver.executeScript("const root=document.querySelector('.iad-workbench');return {bottom:root.getBoundingClientRect().bottom-parseFloat(getComputedStyle(root).paddingBottom),panels:[...document.querySelector('.iad-settings').children].filter(e=>e.tagName==='SECTION').map(e=>{const r=e.getBoundingClientRect();return {width:r.width,top:r.top,bottom:r.bottom}})}");
            const [cards, details] = layout.panels;
            if (width >= 1280) {
              assert.ok(cards.width > details.width * 1.5, "数据集卡片区占主要空间");
              assert.ok(layout.panels.every(panel=>panel.bottom >= layout.bottom-1) && Math.abs(cards.bottom-details.bottom) < 1, "两侧面板铺满工作区高度且底部对齐");
            } else assert.ok(details.top > cards.top, "窄屏详情置于列表下方");
          }
          const control = await element(label === "数据集管理" ? ".iad-section-header button" : ".iad-workbench .iad-header select");
          await driver.executeScript("arguments[0].focus()", control);
          await driver.actions().sendKeys(Key.TAB).perform();
          const metrics = await driver.executeScript(() => {
            const root = document.querySelector(".iad-workbench"), focus = document.activeElement;
            const r = root.getBoundingClientRect(), f = focus.getBoundingClientRect(), s = getComputedStyle(focus);
            const heading = document.createRange(); heading.selectNodeContents(root.querySelector("h1"));
            const canvas = document.createElement("canvas"), context = canvas.getContext("2d", { willReadFrequently: true });
            canvas.width = canvas.height = 1;
            const paint = color => { context.fillStyle = color; context.fillRect(0, 0, 1, 1); };
            const pixels = () => [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
            const unsupported = [], text = [];
            const background = element => {
              context.globalAlpha = 1; context.clearRect(0, 0, 1, 1); paint("white");
              const ancestors = []; for (let p = element; p; p = p.parentElement) ancestors.unshift(p);
              for (const p of ancestors) {
                const style = getComputedStyle(p);
                if (style.backgroundImage !== "none" || style.opacity !== "1") unsupported.push({ tag: p.tagName, css: p.className, image: style.backgroundImage, opacity: style.opacity });
                paint(style.backgroundColor);
              }
              return pixels();
            };
            const colors = (element, color, sample, opacity = 1) => {
              const bg = background(element); context.globalAlpha = opacity; paint(color); context.globalAlpha = 1;
              return { sample, foreground: pixels(), background: bg };
            };
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
              const node = walker.currentNode, parent = node.parentElement;
              if (!node.textContent.trim() || !parent.getClientRects().length || parent.closest(":disabled,[aria-disabled=true]")) continue;
              if (parent.closest("svg")) {
                const style = getComputedStyle(parent), matrix = parent.getScreenCTM();
                const halo = matrix ? parseFloat(style.strokeWidth) * Math.min(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d)) : 0;
                background(parent); context.clearRect(0, 0, 1, 1); paint(style.stroke);
                const stroke = [...context.getImageData(0, 0, 1, 1).data];
                if (!style.paintOrder.startsWith("stroke") || style.strokeOpacity !== "1" || style.fillOpacity !== "1" || stroke[3] !== 255 || halo < 2) {
                  unsupported.push({ tag: "svg", text: node.textContent.trim(), halo, paintOrder: style.paintOrder, stroke }); continue;
                }
                paint(style.fill);
                text.push({ sample: node.textContent.trim(), representation: "svg-outline", foreground: pixels(), background: stroke.slice(0, 3) }); continue;
              }
              text.push(colors(parent, getComputedStyle(parent).color, node.textContent.trim().slice(0, 90)));
            }
            const borders = [...root.querySelectorAll("input:not([type=checkbox]):not([type=radio]),select,textarea")].filter(e => !e.disabled && e.getClientRects().length).map(e => {
              const style = getComputedStyle(e), label = e.getAttribute("aria-label") || e.name || e.tagName;
              text.push(colors(e, style.color, label));
              if (e.placeholder && !e.value) {
                const placeholder = getComputedStyle(e, "::placeholder");
                text.push(colors(e, placeholder.color, `占位文字 ${label}`, parseFloat(placeholder.opacity)));
              }
              const outer = background(e.parentElement);
              paint(style.backgroundColor); const fill = pixels(); paint(style.borderTopColor);
              return { label, outer, fill, border: pixels() };
            });
            const hit = document.elementFromPoint((f.left + f.right) / 2, (f.top + f.bottom) / 2);
            const overflowing = [...root.querySelectorAll("*")].filter(e => e.getBoundingClientRect().right > r.right + 1).map(e => ({ tag: e.tagName, css: e.className, label: e.getAttribute("aria-label"), width: e.getBoundingClientRect().width }));
            return { viewport: [innerWidth, innerHeight], overflow: root.scrollWidth - root.clientWidth, overflowing,
              heading: heading.getBoundingClientRect().height, borders, text, unsupported,
              keyboard: root.contains(focus) && focus.matches(":focus-visible") && s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2 && f.top >= Math.max(0, r.top) && f.bottom <= Math.min(innerHeight, r.bottom) && (hit === focus || focus.contains(hit)),
              reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
              transition: s.transitionDuration, animation: s.animationName };
          });
          metrics.text = metrics.text.map(item => ({ ...item, ratio: contrast.rgb(item.foreground, item.background) }));
          metrics.borders = metrics.borders.map(item => ({ ...item, ratio: Math.max(contrast.rgb(item.outer, item.fill), contrast.rgb(item.outer, item.border)) }));
          const accessibility = await driver.executeAsyncScript(`const done=arguments[arguments.length-1];axe.run(document.querySelector('.iad-workbench'),{runOnly:['button-name','image-alt','label','aria-valid-attr','aria-valid-attr-value','aria-roles']}).then(result=>done({violations:result.violations,incomplete:result.incomplete,passes:result.passes.reduce((n,r)=>n+r.nodes.length,0)})).catch(error=>done({error:String(error)}));`);
          results.push({ ...scope, ...metrics, accessibility });
          await fs.writeFile(path.join(output, "verification.json"), JSON.stringify(results, null, 2));
          await fs.writeFile(path.join(output, `${name}.png`), await driver.takeScreenshot(), "base64");
          assert.deepEqual(metrics.viewport, [width, height], JSON.stringify(scope));
          assert.ok(metrics.overflow <= 1, `${JSON.stringify(scope)} horizontal overflow ${metrics.overflow}px`);
          assert.ok(metrics.keyboard, `${JSON.stringify(scope)} keyboard focus must be visible and unobscured`);
          assert.ok(!accessibility.error, accessibility.error);
          assert.deepEqual(accessibility.violations.map(rule => ({ rule: rule.id, nodes: rule.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })), [], `${JSON.stringify(scope)} accessible names and ARIA`);
          assert.deepEqual(accessibility.incomplete, [], `${JSON.stringify(scope)} unresolved contrast requires inspection`);
          assert.deepEqual(metrics.unsupported, [], `${JSON.stringify(scope)} painted background requires inspection`);
          assert.deepEqual(metrics.text.filter(item => item.ratio < 4.5), [], `${JSON.stringify(scope)} text contrast`);
          assert.deepEqual(metrics.borders.filter(item => item.ratio < 3), [], `${JSON.stringify(scope)} control boundary contrast`);
          assert.equal(metrics.reducedMotion, true, "Actual browser reduced-motion preference");
          assert.equal(metrics.transition, "0s"); assert.equal(metrics.animation, "none");
          const key = `${theme}-${width}-${label}`;
          if (zoom === 1) headings.set(key, metrics.heading);
          else assert.ok(metrics.heading >= headings.get(key) * 1.8, `${JSON.stringify(scope)} actual text must enlarge`);
        }
      }
    }
  }
  await viewport(driver, 1440, 1100); await textZoom(driver, 1);
  assert.equal(results.length, 96, "Six pages × four viewports × two themes × two text sizes");
  return results;
}

export async function viewport(driver, width, height) {
  await driver.setContext("chrome");
  await driver.executeScript("gBrowser.selectedBrowser.style.maxWidth='';gBrowser.selectedBrowser.style.width='';gBrowser.selectedBrowser.style.flex=''");
  await driver.setContext("content");
  await driver.executeAsyncScript("const done=arguments[arguments.length-1];requestAnimationFrame(()=>requestAnimationFrame(()=>done()))");
  const chrome = await driver.executeScript("return {width:outerWidth-innerWidth,height:outerHeight-innerHeight}");
  await driver.manage().window().setRect({ width: width + chrome.width, height: height + chrome.height });
  if (width < 450) {
    await driver.setContext("chrome");
    await driver.executeScript("gBrowser.selectedBrowser.style.maxWidth=arguments[0];gBrowser.selectedBrowser.style.width=arguments[0];gBrowser.selectedBrowser.style.flex='none'", `${width}px`);
    await driver.setContext("content");
  }
  await driver.wait(() => driver.executeScript("return innerWidth===arguments[0] && innerHeight===arguments[1]", width, height), 5000, `Actual viewport ${width}×${height}`);
}

export async function textZoom(driver, zoom) {
  await driver.setContext("chrome");
  const actual = await driver.executeScript("Services.prefs.setIntPref('ui.prefersReducedMotion',1);ZoomManager.useFullZoom=false;ZoomManager.setZoomForBrowser(gBrowser.selectedBrowser,arguments[0]);return [gBrowser.selectedBrowser.textZoom,gBrowser.selectedBrowser.fullZoom]", zoom);
  await driver.setContext("content");
  assert.deepEqual(actual, [zoom, 1], "Browser text-only zoom, with full-page zoom unchanged");
}

export async function setTheme(driver, theme) {
  await viewport(driver, 1920, 1080); await textZoom(driver, 1);
  await driver.findElement(By.xpath("//button[normalize-space(.)='Settings']")).click();
  await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${theme}']`)), 5000).click();
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await driver.wait(() => driver.executeScript("return document.body.hasAttribute('data-ds-dark-theme')===arguments[0]", theme === "Dark"), 5000);
}

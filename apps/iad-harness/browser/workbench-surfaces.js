import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { By, Key, until } from "selenium-webdriver";
import { setTheme, textZoom, viewport } from "./workbench-layout.js";

export async function verifyWorkbenchSurfaces(driver, output) {
  output = path.join(output, String(Date.now()));
  await fs.mkdir(output, { recursive: true });
  console.log(JSON.stringify({ surfaceEvidence: output }));
  const results = [];
  const element = selector => driver.wait(until.elementLocated(By.css(selector)), 10000);
  const button = async label => {
    const locator = By.xpath(`//button[normalize-space(.)='${label}']`);
    const control = await driver.wait(until.elementLocated(locator), 10000);
    await driver.wait(until.elementIsVisible(control), 5000);
    const tab = await control.getAttribute("aria-pressed");
    await control.click();
    if (tab !== null) await driver.wait(async () => (await driver.findElement(locator).getAttribute("aria-pressed")) === "true", 5000);
  };
  const navigate = async label => {
    await (await element(`button[aria-label^='${label}']`)).click();
    await driver.wait(() => driver.executeScript("const e=document.querySelector('.iad-workbench');return e?.querySelector('h1')?.textContent===arguments[0] && e.querySelector('.iad-kpis') && !e.textContent.includes('正在读取知识…')", label), 10000);
  };
  await navigate("人工复核"); await button("复核队列");
  await (await element("img[alt='part-2.png']")).click();
  await (await element(".iad-decision input")).sendKeys("布局验收");
  await (await element(".iad-decision textarea")).sendKeys("仅验证复核记录的显示与操作，未评估工业真值。");
  await (await element(".iad-decision input[type=radio][value=SKIP]")).click(); await button("提交复核");
  await driver.wait(() => driver.executeScript("return document.querySelector('.iad-review-confirmation')?.textContent.includes('跳过')"), 10000);
  for (const theme of ["Light", "Dark"]) {
    await setTheme(driver, theme); await textZoom(driver, 2);
    for (const [width, height] of [[375, 812], [1920, 1080], [1366, 768], [1280, 800]]) {
      await viewport(driver, width, height);
      const capture = async (name, focus, root = ".iad-workbench") => {
        const control = await element(focus);
        await driver.wait(until.elementIsVisible(control), 5000);
        await driver.executeScript("arguments[0].focus()", control);
        await driver.actions().sendKeys(Key.TAB).keyDown(Key.SHIFT).sendKeys(Key.TAB).keyUp(Key.SHIFT).perform();
        if (name === "image-status") await element(".iad-tooltip");
        assert.equal(await driver.executeScript("return document.activeElement===arguments[0]", control), true, `${name}: Tab and Shift+Tab return to the original control`);
        const metrics = await driver.executeScript(selector => {
          const root = document.querySelector(selector), focus = document.activeElement;
          const r = root.getBoundingClientRect(), f = focus.getBoundingClientRect(), style = getComputedStyle(focus);
          const hit = document.elementFromPoint((f.left + f.right) / 2, (f.top + f.bottom) / 2);
          const panes = [...root.querySelectorAll('.iad-viewer-viewport,.iad-inspection-panel')].map(e => ({ css: e.className, width: e.clientWidth, height: e.clientHeight }));
          return { viewport: [innerWidth, innerHeight], overflow: root.scrollWidth - root.clientWidth, panes,
            focus: { label: (focus.getAttribute('aria-label') || focus.textContent).slice(0, 90), inside: root.contains(focus), visible: focus.matches(':focus-visible') && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
              unobscured: f.top >= Math.max(0, r.top) && f.bottom <= Math.min(innerHeight, r.bottom) && (hit === focus || focus.contains(hit)) },
            overflowing: [...root.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > r.right + 1).map(e => ({ tag: e.tagName, css: e.className, text: e.textContent.slice(0, 90) })) };
        }, root);
        const scope = { theme, width, height, zoom: 2, name };
        results.push({ ...scope, ...metrics });
        await fs.writeFile(path.join(output, "verification.json"), JSON.stringify(results, null, 2));
        await fs.writeFile(path.join(output, `${theme.toLowerCase()}-${width}-${name}.png`), await driver.takeScreenshot(), "base64");
        assert.deepEqual(metrics.viewport, [width, height], JSON.stringify(scope));
        assert.ok(metrics.overflow <= 1, `${JSON.stringify(scope)} horizontal overflow ${metrics.overflow}: ${JSON.stringify(metrics.overflowing)}`);
        assert.ok(metrics.focus.inside && metrics.focus.visible && metrics.focus.unobscured, `${JSON.stringify(scope)} focus ${JSON.stringify(metrics.focus)}`);
        assert.ok(metrics.panes.every(pane => pane.width >= 120 && pane.height >= 120), `${JSON.stringify(scope)} usable image and inspection panes ${JSON.stringify(metrics.panes)}`);
        if (root.startsWith("dialog")) {
          const modal = await driver.executeScript(selector => {
            const dialog = document.querySelector(selector);
            if (!dialog.matches(":modal")) throw new Error("Expected a native modal dialog");
            document.querySelector(".iad-header select").focus();
            return dialog.contains(document.activeElement);
          }, root);
          assert.equal(modal, true, `${name}: native modal blocks focus on background controls`);
        }
      };
      await navigate("数据集管理"); await button("添加数据集");
      await capture("dataset-import", "dialog[open] #dataset-name", "dialog[open]");
      await button("取消");
      assert.equal(await driver.executeScript("return document.activeElement.textContent"), "添加数据集");
      for (const label of ["挖掘良品知识", "挖掘不良品知识"]) {
        await navigate(label);
        await (await element("select[aria-label='知识版本'] option[value='']")).click();
        await button("知识条目");
        await driver.wait(() => driver.executeScript("return !document.querySelector('.iad-knowledge-page').textContent.includes('正在读取知识…')"), 10000);
        await capture(label + "-checks", ".iad-knowledge-content input");
        await button("修订判据");
        await capture(label + "-revision", "dialog[open] textarea", "dialog[open]");
        await button("取消");
        assert.equal(await driver.executeScript("return document.activeElement.textContent"), "修订判据");
        await button("版本"); await capture(label + "-versions", ".iad-knowledge-content button");
        await button(label === "挖掘良品知识" ? "待核实" : "标注核验");
        await capture(label + "-findings", ".iad-knowledge-content button");
      }
      await navigate("模型审计"); await button("模型审计作业");
      await element(".iad-job-panel .iad-profile");
      await (await element(".iad-model-settings summary")).click();
      await capture("audit-jobs", "input[aria-label='模型名称']");
      await (await driver.findElement(By.xpath("//summary[starts-with(normalize-space(.),'良品知识 ·')]"))).click();
      await (await element("button[title='放大知识来源图']")).click();
      await capture("audit-source", "dialog[open] select[aria-label='缩放']", "dialog[open]");
      await button("关闭");
      await button("报告");
      await element(".iad-quality-report dl");
      await (await element(".iad-quality-report summary")).click();
      await capture("audit-report", ".iad-quality-report summary");
      await navigate("人工复核"); await button("复核记录");
      await element(".iad-review-records tbody tr");
      await capture("review-records", ".iad-table-scroll");
      await (await element(".iad-review-records tbody button")).click();
      await capture("review-history", ".iad-decision input");
      await navigate("图像浏览");
      await driver.actions().move({origin:await element(".iad-header h1")}).perform();
      await capture("image-status", ".iad-status-trigger");
      assert.equal(await driver.executeScript("const r=document.querySelector('.iad-tooltip').getBoundingClientRect();return r.left>=0 && r.top>=0 && r.right<=innerWidth && r.bottom<=innerHeight"), true, "状态提示保持在视口内");
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      await (await element("summary[aria-label='标注筛选']")).click();
      await capture("annotation-filters", "input[aria-label='无标注']");
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      assert.equal(await driver.executeScript("return document.activeElement.getAttribute('aria-label')"), "标注筛选");
      assert.equal(await driver.executeScript("return document.querySelector('summary[aria-label=标注筛选]').parentElement.open"), false);
      await (await element("img[alt='part-2.png']")).click();
      await capture("sample-details", "dialog[open] button[title='放大图像']", "dialog[open]");
      await (await element("button[title='放大图像']")).click();
      await (await element("button[aria-label='定位 ROI 1']")).click();
      await capture("image-inspection", "dialog.iad-viewer-dialog button[aria-label='放大']", "dialog.iad-viewer-dialog");
      await (await element("summary[aria-label='可视图层']")).click();
      await capture("image-layers", "input[aria-label='标注图层']", "dialog.iad-viewer-dialog");
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      await button("向 Agent 追问");
      await capture("image-question", "textarea[aria-label='追问内容']", "dialog.iad-viewer-dialog");
      await button("关闭"); await (await element("button[aria-label='关闭图像详情']")).click();
    }
  }
  assert.equal(results.length, 160, "Twenty real detail surfaces × four viewports × two themes at 200% text zoom");
  await viewport(driver, 1440, 1100); await textZoom(driver, 1);
  for (const label of ["挖掘良品知识", "挖掘不良品知识"]) { await navigate(label); await button("知识条目"); }
  await navigate("人工复核"); await button("复核队列");
  await navigate("图像浏览");
  return results;
}

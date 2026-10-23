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
    await driver.wait(() => driver.executeScript("const e=document.querySelector('.iad-workbench');return e?.querySelector('h1')?.textContent===arguments[0] && !e.textContent.includes('正在读取知识…')", label), 10000);
  };
  await viewport(driver,1920,1080);await textZoom(driver,1);
  await navigate("人工复核"); await button("复核队列");
  await (await element("img[alt='part-2.png']")).click();
  await (await element(".iad-decision input[required]")).sendKeys("布局验收");
  await (await element(".iad-decision textarea")).sendKeys("仅验证复核记录的显示与操作，未评估工业真值。");
  await (await element(".iad-decision input[type=radio][value=SKIP]")).click(); await button("提交复核");
  await driver.wait(() => driver.executeScript("return document.querySelector('.iad-review-confirmation')?.textContent.includes('跳过')"), 10000);
  for (const theme of ["Light", "Dark"]) {
    await setTheme(driver, theme); await textZoom(driver, 2);
    for (const [width, height] of [[375, 812], [1920, 1080], [1366, 768], [1280, 800]]) {
      await viewport(driver, width, height);
      const capture = async (name, focus, root = ".iad-workbench") => {
        const control = await element(focus);
        await driver.wait(until.elementIsVisible(control), 5000);await driver.wait(until.elementIsEnabled(control),5000);
        await driver.executeScript("arguments[0].focus()", control);
        if (name === "dataset-row-name" || name === "dataset-detail-name") await control.sendKeys(Key.ARROW_LEFT);
        else await driver.actions().keyDown(Key.SHIFT).sendKeys(Key.TAB).keyUp(Key.SHIFT).sendKeys(Key.TAB).perform();
        if (name === "image-status") await element(".iad-tooltip");
        assert.equal(await driver.executeScript("return document.activeElement===arguments[0]", control), true, `${name}: keyboard focus remains on the active control`);
        const metrics = await driver.executeScript(selector => {
          const root = document.querySelector(selector), focus = document.activeElement;
          const r = root.getBoundingClientRect(), f = focus.getBoundingClientRect(), style = getComputedStyle(focus);
          const hit = document.elementFromPoint((f.left + f.right) / 2, (f.top + f.bottom) / 2);
          const panes = [...root.querySelectorAll('.iad-viewer-viewport,.iad-inspection-panel')].map(e => ({ css: e.className, width: e.clientWidth, height: e.clientHeight }));
          return { viewport: [innerWidth, innerHeight], overflow: root.scrollWidth - root.clientWidth, panes,
            focus: { label: (focus.getAttribute('aria-label') || focus.textContent).slice(0, 90), inside: root.contains(focus), focusVisible:focus.matches(':focus-visible'),outline:style.outlineStyle,outlineWidth:style.outlineWidth,visible: focus.matches(':focus-visible') && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
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
            document.querySelector(".iad-header select,.iad-header button").focus();
            return dialog.contains(document.activeElement);
          }, root);
          assert.equal(modal, true, `${name}: native modal blocks focus on background controls`);
        }
      };
      await navigate("数据集管理"); await button("添加数据集");
      await capture("dataset-import", "dialog[open] #dataset-name", "dialog[open]");
      await button("取消");
      assert.equal(await driver.executeScript("return document.activeElement.textContent"), "添加数据集");
      await (await element(".iad-dataset-row button[aria-label^='修改数据集名称']")).click();
      await capture("dataset-row-name", "input[aria-label='列表数据集名称']"); await driver.actions().sendKeys(Key.ESCAPE).perform();
      await driver.wait(() => driver.executeScript("return !document.querySelector('input[aria-label=\"列表数据集名称\"]') && document.activeElement.matches('.iad-dataset-row .iad-name-trigger')"), 5000);
      await button("基本信息");
      await (await element("section[aria-label='当前数据集详情'] button[aria-label^='修改数据集名称']")).click();
      await capture("dataset-detail-name", "input[aria-label='新的数据集名称']"); await driver.actions().sendKeys(Key.ESCAPE).perform();
      await driver.wait(() => driver.executeScript("return !document.querySelector('input[aria-label=\"新的数据集名称\"]') && document.activeElement.matches('section[aria-label=\"当前数据集详情\"] .iad-name-trigger')"), 5000);
      await button("目录与映射");
      await(await element(".iad-dataset-row summary[aria-label^='更多操作']")).click();
      await (await element(".iad-dataset-row button[aria-label^='删除数据集']")).click();
      assert.equal(await driver.executeScript("return document.activeElement.getAttribute('aria-label')"), "取消删除", "删除弹窗打开后默认聚焦取消");
      await capture("dataset-delete", "dialog[open] button[aria-label='取消删除']", "dialog[open]"); await button("取消");
      assert.ok((await driver.executeScript("return document.activeElement.getAttribute('aria-label')")).startsWith("删除数据集"));
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      for (const label of ["良品", "异常"]) {
        await navigate("知识挖掘"); await button(label);
        const back=await driver.findElements(By.xpath("//button[normalize-space(.)='返回知识结果']"));if(back.length)await back[0].click();
        await button("知识条目");await(await element("select[aria-label='知识版本'] option[value='']")).click();
        await driver.wait(() => driver.executeScript("return !document.querySelector('.iad-knowledge-page').textContent.includes('正在读取知识…')"), 10000);
        await capture(label + "-checks", ".iad-knowledge-content input");
        await button("作为预设继续选图");
        await capture(label + "-group", "input[aria-label='挖掘图像数量']");
        assert.ok(await (await element("select[aria-label='知识预设']")).getAttribute("value"));
        await capture(label + "-preset", "select[aria-label='知识预设']");
        await button("返回知识结果");await button("版本"); await capture(label + "-versions", ".iad-knowledge-content button");
        await button(label === "良品" ? "待核实" : "标注核验");
        await capture(label + "-findings", '[aria-label="知识视图"] button.active');
      }
      await navigate("模型审计");await button("模型审计作业");
      await capture("audit-jobs",'select[aria-label="任务状态"]');
      await button("新建审计");await capture("audit-setup",'select[aria-label="审计良品知识版本"]','dialog.iad-drawer');
      await(await driver.findElement(By.xpath("//summary[starts-with(normalize-space(.),'良品知识 ·')]"))).click();
      await(await element("dialog.iad-drawer button[title='放大冻结证据']")).click();
      await capture("audit-source", "dialog.iad-viewer-dialog select[aria-label='缩放']", "dialog.iad-viewer-dialog");await button("关闭");
      await(await element('button[aria-label="关闭新建模型审计"]')).click();
      await button("报告");
      await element(".iad-quality-report dl");
      await (await element(".iad-quality-report summary")).click();
      await capture("audit-report", ".iad-quality-report summary");
      await navigate("人工复核"); await button("复核记录");
      await element(".iad-review-records tbody tr");
      await capture("review-records", ".iad-table-scroll");
      await (await element(".iad-review-records tbody button")).click();
      await capture("review-history", ".iad-decision input[required]");
      await navigate("图像浏览");
      await driver.actions().move({origin:"viewport",x:2,y:2}).perform();
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
  assert.equal(results.length, 208, "26个实际交互表面 × 四视口 × 明暗主题，均使用200%文字缩放");
  await viewport(driver, 1440, 1100); await textZoom(driver, 1);
  for (const label of ["良品", "异常"]) { await navigate("知识挖掘"); await button(label); await button("知识条目"); }
  await navigate("人工复核"); await button("复核队列");
  await navigate("图像浏览");
  return results;
}

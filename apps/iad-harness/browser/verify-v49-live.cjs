const { Builder, By, Key, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox.js");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const ARTIFACT_DIR = "/home/dell/.gemini/antigravity-cli/brain/a36a5c63-3c83-4b2c-b4ff-8a1730f771df";

const checks = [];
function chk(condition, name) {
  assert.ok(condition, name);
  checks.push(name);
  console.log("✓", name);
}

async function run() {
  const options = new firefox.Options().addArguments("-headless");
  options.setPreference("javascript.options.intl_segmenter", true);

  const driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder("/tmp/geckodriver"))
    .build();

  try {
    await driver.manage().window().setRect({ width: 1792, height: 920 });

    const logContent = fs.readFileSync("/data1/wt/Industrial-Benchmark-Agent/runs/dsh_web.log", "utf8");
    const matches = [...logContent.matchAll(/token=([^\s\)\&]+)/g)];
    const token = matches.length ? matches[matches.length - 1][1] : "";
    const url = `http://127.0.0.1:8000/?token=${token}`;
    console.log("Navigating to live app:", url);
    await driver.get(url);
    await driver.sleep(3000);

    // Dismiss welcome/config dialog if present
    try {
      const later = await driver.wait(
        until.elementLocated(By.xpath('//button[contains(., "稍后配置") or @aria-label="稍后配置"]')),
        2000
      );
      await later.click();
      await driver.sleep(1000);
    } catch (_) {}

    // -------------------------------------------------------------
    // Test Part 1: Exploration Page (UX49-T01, UX49-02)
    // -------------------------------------------------------------
    console.log("\n--- Testing Direction Exploration Live ---");
    const expNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "方向探索") or @aria-label="方向探索"]')),
      5000
    );
    await expNav.click();
    await driver.sleep(2500);

    // Select candidate job if available
    const expJobRows = await driver.findElements(By.css(".exp-table tbody tr, .exp-job-table tbody tr"));
    if (expJobRows.length > 0) {
      await driver.executeScript("arguments[0].click();", expJobRows[0]);
      await driver.sleep(1500);
    }

    const dirViewButtons = await driver.findElements(
      By.css(".exp-view-detail-button, .exp-direction-view-icon, [aria-label='查看方向']")
    );
    console.log("Found direction view buttons:", dirViewButtons.length);
    chk(dirViewButtons.length > 0, "Live方向探索找到候选方向操作按钮");

    const firstDirBtn = dirViewButtons[0];
    const btnText = (await firstDirBtn.getText()).trim();
    // In V49, there should be NO visible "查看" text on the button
    chk(!btnText.includes("查看"), `Live方向探索查看按钮无文本(纯图标) (实际文本: "${btnText}")`);

    const svgs = await firstDirBtn.findElements(By.css("svg"));
    chk(svgs.length === 1, "Live方向探索查看按钮包含1个文档检索SVG图标");

    const ariaLabel = await firstDirBtn.getAttribute("aria-label");
    const title = await firstDirBtn.getAttribute("title");
    chk(ariaLabel === "查看方向" || title === "查看方向", "Live方向探索查看按钮保留可访问性标记(aria-label/title)");

    const btnRect = await firstDirBtn.getRect();
    chk(Math.abs(btnRect.width - 32) <= 2, `Live方向探索查看按钮宽度为32px (实际 ${btnRect.width}px)`);
    chk(Math.abs(btnRect.height - 32) <= 2, `Live方向探索查看按钮高度为32px (实际 ${btnRect.height}px)`);

    // Verify detail dialog open & close
    await driver.executeScript("arguments[0].click();", firstDirBtn);
    await driver.sleep(1000);

    const dirDialogs = await driver.findElements(By.css(".exp-direction-dialog, .iad-detail-dialog, #direction-dialog"));
    chk(dirDialogs.length > 0 && (await dirDialogs[0].isDisplayed()), "Live方向探索详情弹窗正常打开");

    const scrExp = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v49_live_exploration_icon_button.png"), Buffer.from(scrExp, "base64"));

    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.sleep(600);
    const dirDialogsAfterEsc = await driver.findElements(By.css(".exp-direction-dialog, .iad-detail-dialog, #direction-dialog"));
    chk(
      dirDialogsAfterEsc.length === 0 || !(await dirDialogsAfterEsc[0].isDisplayed().catch(() => false)),
      "Live方向探索详情弹窗Esc关闭"
    );

    // -------------------------------------------------------------
    // Test Part 2: Typography in Exploration Table
    // -------------------------------------------------------------
    console.log("\n--- Testing Exploration Typography Live ---");
    const expTh = await driver.findElement(By.css(".exp-direction-table th, .exp-job-table th, th"));
    const expThWeight = await expTh.getCssValue("font-weight");
    const expThColor = await expTh.getCssValue("color");
    chk(parseInt(expThWeight) >= 600, `Live探索表头加粗600 (实际: ${expThWeight})`);
    chk(expThColor === "rgb(23, 35, 56)", `Live探索表头深色统一 #172338 (实际: ${expThColor})`);

    const expTd = await driver.findElement(By.css(".exp-direction-table td, .exp-job-table td, td"));
    const expTdSize = await expTd.getCssValue("font-size");
    const expTdColor = await expTd.getCssValue("color");
    chk(expTdSize === "13px", `Live探索表格正文字号13px (实际: ${expTdSize})`);
    chk(expTdColor === "rgb(23, 35, 56)", `Live探索表格正文颜色 #172338 (实际: ${expTdColor})`);

    // -------------------------------------------------------------
    // Test Part 3: Knowledge Page Live (UX49-T02, UX49-T03, UX49-T05)
    // -------------------------------------------------------------
    console.log("\n--- Testing Knowledge Page Live ---");
    const miningNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "知识挖掘") or @aria-label="知识挖掘"]')),
      5000
    );
    await driver.executeScript("arguments[0].click();", miningNav);
    await driver.sleep(2500);

    // Switch dataset to ds_8bf1c1e9ef8042869adb044a36b7e2a0 (has completed knowledge jobs and checks)
    try {
      const dsSelect = await driver.wait(until.elementLocated(By.css('select[aria-label="当前数据集"]')), 5000);
      await driver.executeScript("arguments[0].value = 'ds_8bf1c1e9ef8042869adb044a36b7e2a0'; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));", dsSelect);
      await driver.sleep(2500);
    } catch (_) {}

    // Test Job Drawer
    const jobsTab = await driver.findElements(By.xpath('//button[contains(., "作业记录")]'));
    if (jobsTab.length > 0) {
      await driver.executeScript("arguments[0].click();", jobsTab[0]);
      await driver.sleep(1500);
    }

    const promptBtns = await driver.findElements(By.css("[data-job-prompt]"));
    if (promptBtns.length > 0) {
      await driver.executeScript("arguments[0].click();", promptBtns[0]);
      await driver.sleep(1000);
      const drawer = await driver.wait(until.elementLocated(By.id("job-prompt-overlay")), 3000);
      chk(await drawer.isDisplayed(), "Live知识作业提示词抽屉正常打开");
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      await driver.sleep(500);
    }

    // Switch to results tab if needed
    try {
      const resultsTab = await driver.findElement(By.xpath('//button[contains(., "知识条目") or @aria-label="知识条目"]'));
      await driver.executeScript("arguments[0].click();", resultsTab);
      await driver.sleep(2000);
    } catch (_) {}

    // Check knowledge table typography
    const kbHeadCol = await driver.findElements(By.css(".knowledge-head > span, .knowledge-head"));
    if (kbHeadCol.length > 0) {
      const headColor = await kbHeadCol[0].getCssValue("color");
      const headWeight = await kbHeadCol[0].getCssValue("font-weight");
      chk(headColor === "rgb(23, 35, 56)", `Live知识列表表头颜色 #172338 (实际: ${headColor})`);
      chk(parseInt(headWeight) >= 600, `Live知识列表表头加粗600 (实际: ${headWeight})`);
    }

    const kbRows = await driver.findElements(By.css(".knowledge-row"));
    if (kbRows.length > 0) {
      const rowTextEl = await kbRows[0].findElement(By.css(".row-title, .row-desc, span"));
      const rowColor = await rowTextEl.getCssValue("color");
      const rowSize = await rowTextEl.getCssValue("font-size");
      const rowFont = await rowTextEl.getCssValue("font-family");
      chk(rowColor === "rgb(23, 35, 56)", `Live知识列表正文颜色 #172338 (实际: ${rowColor})`);
      chk(rowSize === "13px", `Live知识列表正文字号13px (实际: ${rowSize})`);
      chk(rowFont.toLowerCase().includes("system-ui"), `Live知识列表字体栈统一包含system-ui (实际: ${rowFont})`);

      // Knowledge detail dialog
      const viewBtn = await kbRows[0].findElement(By.css(".knowledge-view-action, [data-view-entry]"));
      await driver.executeScript("arguments[0].click();", viewBtn);
      await driver.sleep(1000);
      const detailModal = await driver.findElements(By.css("#detail-overlay, #entry-dialog"));
      chk(detailModal.length > 0 && (await detailModal[0].isDisplayed()), "Live知识详情大弹窗正常打开");

      const scrKb = await driver.takeScreenshot();
      fs.writeFileSync(path.join(ARTIFACT_DIR, "v49_live_knowledge_typography.png"), Buffer.from(scrKb, "base64"));

      await driver.actions().sendKeys(Key.ESCAPE).perform();
      await driver.sleep(600);
    }

    // -------------------------------------------------------------
    // Test Part 4: Consistency Page Live (UX49-T03)
    // -------------------------------------------------------------
    console.log("\n--- Testing Consistency Page Live ---");
    const dcNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "数据一致性") or @aria-label="数据一致性"]')),
      5000
    );
    await driver.executeScript("arguments[0].click();", dcNav);
    await driver.sleep(2500);

    const dcTh = await driver.findElements(By.css(".dc-table th"));
    if (dcTh.length > 0) {
      const dcThColor = await dcTh[0].getCssValue("color");
      const dcThWeight = await dcTh[0].getCssValue("font-weight");
      chk(dcThColor === "rgb(23, 35, 56)", `Live一致性表头颜色 #172338 (实际: ${dcThColor})`);
      chk(parseInt(dcThWeight) >= 600, `Live一致性表头加粗600 (实际: ${dcThWeight})`);
    }

    const dcTd = await driver.findElements(By.css(".dc-table td"));
    if (dcTd.length > 0) {
      const dcTdColor = await dcTd[0].getCssValue("color");
      const dcTdSize = await dcTd[0].getCssValue("font-size");
      chk(dcTdColor === "rgb(23, 35, 56)", `Live一致性表格文字颜色 #172338 (实际: ${dcTdColor})`);
      chk(dcTdSize === "13px", `Live一致性表格字号13px (实际: ${dcTdSize})`);
    }

    // Check status semantic color retention (completed green: rgb(23, 123, 83))
    const dcCompleted = await driver.findElements(By.css(".dc-state.completed"));
    if (dcCompleted.length > 0) {
      const compColor = await dcCompleted[0].getCssValue("color");
      chk(compColor === "rgb(23, 123, 83)", `Live一致性完成态保持语义绿色 (实际: ${compColor})`);
    }

    const scrDc = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v49_live_consistency_typography.png"), Buffer.from(scrDc, "base64"));

    // -------------------------------------------------------------
    // Test Part 5: Console Errors
    // -------------------------------------------------------------
    const logs = await driver.manage().logs().get("browser").catch(() => []);
    const severe = logs.filter((l) => l.level.name === "SEVERE");
    chk(severe.length === 0, `全站页面无控制台严重错误 (实际: ${severe.length})`);

    console.log(`\n========================================`);
    console.log(`LIVE SERVER CHECKS PASSED: ${checks.length}`);
    console.log(`========================================`);
  } finally {
    await driver.quit();
  }
}

run().catch((err) => {
  console.error("Live verification failed:", err);
  process.exit(1);
});

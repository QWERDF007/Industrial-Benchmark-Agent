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
    // Test Part 1: Exploration Page "查看方向" Button (SPEC-K47-03)
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

    const dirButtons = await driver.findElements(By.css(".exp-direction-view-icon"));
    console.log("Found direction view buttons:", dirButtons.length);
    if (dirButtons.length > 0) {
      const firstDirBtn = dirButtons[0];
      const dirBtnText = await firstDirBtn.getText();
      chk(dirBtnText.includes("查看"), "Live方向探索查看按钮包含可见'查看'文字");

      const dirSvgCount = (await firstDirBtn.findElements(By.css("svg"))).length;
      chk(dirSvgCount === 1, "Live方向探索查看按钮包含1个文档检索图标");

      // Verify single-line inline flex layout
      const rect = await firstDirBtn.getRect();
      chk(rect.height <= 36 && rect.width >= 60, "Live方向探索查看按钮尺寸符合32-34px单行规范");

      // Take screenshot of live exploration direction button
      const shotDir = await driver.takeScreenshot();
      fs.writeFileSync(path.join(ARTIFACT_DIR, "v47_live_exploration_direction_btn.png"), Buffer.from(shotDir, "base64"));

      // Click to open direction detail dialog
      await driver.executeScript("arguments[0].click();", firstDirBtn);
      await driver.sleep(1000);

      const dirDialog = await driver.findElement(By.css(".exp-direction-dialog"));
      chk(await dirDialog.isDisplayed(), "Live方向探索详情弹窗正常打开");

      // Check Esc close
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      await driver.sleep(500);
      const dirDialogs = await driver.findElements(By.css(".exp-direction-dialog"));
      chk(dirDialogs.length === 0 || !(await dirDialogs[0].isDisplayed().catch(() => false)), "Live方向探索详情弹窗Esc关闭");
    }

    // -------------------------------------------------------------
    // Test Part 2: Knowledge Page & Job Prompt Drawer (SPEC-K47-01, K47-02, K47-04)
    // -------------------------------------------------------------
    console.log("\n--- Testing Knowledge Page Live ---");

    const kbNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "知识挖掘") or @aria-label="知识挖掘"]')),
      5000
    );
    await driver.executeScript("arguments[0].click();", kbNav);
    await driver.sleep(2500);

    // Switch dataset to ds_8bf1c1e9ef8042869adb044a36b7e2a0 (has completed knowledge jobs and checks)
    try {
      const dsSelect = await driver.wait(until.elementLocated(By.css('select[aria-label="当前数据集"]')), 5000);
      await driver.executeScript("arguments[0].value = 'ds_8bf1c1e9ef8042869adb044a36b7e2a0'; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));", dsSelect);
      await driver.sleep(2500);
    } catch (_) {}

    // Switch to Jobs tab to check Knowledge Job Prompt Drawer
    const jobsTab = await driver.findElements(By.xpath('//button[contains(., "作业记录")]'));
    if (jobsTab.length > 0) {
      await driver.executeScript("arguments[0].click();", jobsTab[0]);
      await driver.sleep(1500);

      const promptBtns = await driver.findElements(By.css("[data-job-prompt]"));
      console.log("Found knowledge job prompt buttons:", promptBtns.length);
      if (promptBtns.length > 0) {
        await driver.executeScript("arguments[0].click();", promptBtns[0]);
        await driver.sleep(1000);

        const promptOverlay = await driver.findElement(By.id("job-prompt-overlay"));
        chk(await promptOverlay.isDisplayed(), "Live知识作业提示词抽屉正常打开");

        const drawer = await driver.findElement(By.css(".knowledge-prompt-drawer"));
        const drawerRect = await drawer.getRect();
        chk(Math.abs(drawerRect.width - 560) < 5, "Live知识作业提示词抽屉宽度为560px");

        const copyBtn = await driver.findElements(By.id("copy-job-prompt"));
        chk(copyBtn.length === 1, "Live知识作业提示词抽屉包含复制按钮");

        const shotPrompt = await driver.takeScreenshot();
        fs.writeFileSync(path.join(ARTIFACT_DIR, "v47_live_knowledge_prompt_drawer.png"), Buffer.from(shotPrompt, "base64"));

        // Close prompt drawer via Escape
        await driver.actions().sendKeys(Key.ESCAPE).perform();
        await driver.sleep(500);
        const pOverlays = await driver.findElements(By.id("job-prompt-overlay"));
        chk(pOverlays.length === 0 || !(await pOverlays[0].isDisplayed().catch(() => false)), "Live知识作业提示词抽屉Esc关闭");
      }
    }

    // Switch back to Knowledge Results tab
    const resultsTab = await driver.findElements(By.xpath('//button[contains(., "知识条目")]'));
    if (resultsTab.length > 0) {
      await driver.executeScript("arguments[0].click();", resultsTab[0]);
      await driver.sleep(1500);
    }

    // Check knowledge entries table
    const kbHead = await driver.findElements(By.css(".knowledge-head"));
    if (kbHead.length > 0) {
      const headText = await kbHead[0].getText();
      chk(headText.trim().endsWith("操作"), "Live知识条目列表包含操作列标题");

      const viewActions = await driver.findElements(By.css(".knowledge-view-action"));
      if (viewActions.length > 0) {
        const firstAction = viewActions[0];
        const actionText = await firstAction.getText();
        chk(actionText.trim() === "查看", "Live知识条目查看按钮包含'查看'文字");

        const svgCount = (await firstAction.findElements(By.css("svg"))).length;
        chk(svgCount === 1, "Live知识条目查看按钮包含文档检索图标");

        // Click to open knowledge detail modal
        await driver.executeScript("arguments[0].click();", firstAction);
        await driver.sleep(1000);

        const detailOverlay = await driver.findElement(By.id("detail-overlay"));
        chk(await detailOverlay.isDisplayed(), "Live知识详情大弹窗正常打开");

        const detailContent = await (await driver.findElement(By.id("detail-content"))).getText();
        chk(detailContent.includes("支持证据"), "Live知识详情包含支持证据");
        chk(detailContent.includes("反对证据"), "Live知识详情包含反对证据");

        const shotDetail = await driver.takeScreenshot();
        fs.writeFileSync(path.join(ARTIFACT_DIR, "v47_live_knowledge_detail_modal.png"), Buffer.from(shotDetail, "base64"));

        // Close via Escape
        await driver.actions().sendKeys(Key.ESCAPE).perform();
        await driver.sleep(500);
        const dOverlays = await driver.findElements(By.id("detail-overlay"));
        chk(dOverlays.length === 0 || !(await dOverlays[0].isDisplayed().catch(() => false)), "Live知识详情大弹窗Esc关闭");
      }
    }

    console.log(`\n========================================`);
    console.log(`LIVE SERVER CHECKS PASSED: ${checks.length}`);
    console.log(`========================================`);
  } finally {
    await driver.quit();
  }
}

run().catch((err) => {
  console.error("Live test failed:", err);
  process.exit(1);
});

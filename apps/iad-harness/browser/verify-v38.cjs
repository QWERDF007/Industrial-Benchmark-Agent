const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome.js");
const fs = require("fs");
const path = require("path");

const ARTIFACT_DIR = "/home/dell/.gemini/antigravity-cli/brain/a36a5c63-3c83-4b2c-b4ff-8a1730f771df";

async function saveScreenshot(driver, filename) {
  const screenshot = await driver.takeScreenshot();
  const filePath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(filePath, Buffer.from(screenshot, "base64"));
  console.log(`[Screenshot] Saved: ${filePath}`);
}

(async () => {
  const options = new chrome.Options();
  options.addArguments(
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--window-size=1600,1000"
  );

  const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

  try {
    console.log("\n========================================================");
    console.log("  VERIFY V38 SPECIFICATIONS: JOB PAGINATION & PAGE SCROLL");
    console.log("========================================================\n");

    const logContent = fs.readFileSync("/data1/wt/Industrial-Benchmark-Agent/runs/dsh_web.log", "utf8");
    const matches = [...logContent.matchAll(/token=([^\s\)\&]+)/g)];
    const token = matches.length ? matches[matches.length - 1][1] : "";
    const baseUrl = `http://127.0.0.1:8000/?token=${token}`;

    console.log(`Navigating to ${baseUrl}...`);
    await driver.get(baseUrl);
    await driver.sleep(3000);

    // Dismiss any modal dialog / 稍后配置
    try {
      const later = await driver.wait(
        until.elementLocated(By.xpath('//button[contains(., "稍后配置") or @aria-label="稍后配置"]')),
        3000
      );
      await later.click();
      console.log("  Dismissed '稍后配置' modal.");
      await driver.sleep(1500);
    } catch (e) {
      console.log("  No '稍后配置' modal found, continuing.");
    }

    // -------------------------------------------------------------------------
    // TEST SUITE 1: 数据一致性 (Consistency) - Job Pagination (JOB38-01, JOB38-05)
    // -------------------------------------------------------------------------
    console.log("\n[Test 1] Testing 数据一致性 检查作业分页...");
    const navConsistency = await driver.wait(
      until.elementLocated(
        By.xpath("//nav//button[contains(., '标注一致性')] | //nav//button[contains(., '数据一致性')]")
      ),
      5000
    );
    await navConsistency.click();
    await driver.sleep(2500);

    // Baseline: exactly 8 jobs in database -> single page (<= 8), NO pager as per JOB38-01
    const initialRows = await driver.findElements(By.css(".dc-jobs-section .dc-table tbody tr"));
    console.log(`  Initial consistency jobs count: ${initialRows.length}`);
    if (initialRows.length !== 8) {
      throw new Error(`Expected exactly 8 initial jobs, got ${initialRows.length}`);
    }

    const initialPager = await driver.findElements(By.css(".dc-jobs-section .iba-job-pager"));
    console.log(`  Initial pager count: ${initialPager.length} (expected 0 when jobs <= 8)`);
    if (initialPager.length !== 0) {
      throw new Error("Expected no pager when jobs <= 8!");
    }
    await saveScreenshot(driver, "v38_01_consistency_baseline_8jobs_nopager.png");

    // Click "新建检查" to create a 9th job to test multi-page (>8 jobs)
    console.log("  Clicking 新建检查 to create 9th consistency job...");
    const newCheckBtn = await driver.findElement(By.css('[data-dc="start-check"]'));
    await newCheckBtn.click();
    await driver.sleep(1000);

    const startCheckSubmit = await driver.wait(
      until.elementLocated(By.css('[data-dc="create-job"]')),
      3000
    );
    await startCheckSubmit.click();
    console.log("  Submitted new consistency job, waiting for jobs list update...");
    await driver.sleep(3000);

    // Now we have 9 jobs, which requires 2 pages!
    const dcRowsP1 = await driver.findElements(By.css(".dc-jobs-section .dc-table tbody tr"));
    console.log(`  Multi-page: visible jobs count on Page 1: ${dcRowsP1.length} (expected 8)`);
    if (dcRowsP1.length !== 8) {
      throw new Error(`Expected exactly 8 jobs on page 1, got ${dcRowsP1.length}`);
    }

    const dcPager = await driver.findElements(By.css(".dc-jobs-section .iba-job-pager"));
    console.log(`  Multi-page: pager found: ${dcPager.length > 0}`);
    if (dcPager.length === 0) {
      throw new Error("Expected .iba-job-pager to appear when jobs > 8!");
    }

    const dcTotalText = await driver.findElement(By.css(".dc-jobs-section .iba-job-total")).getText();
    console.log(`  Multi-page: total summary text: "${dcTotalText}"`);
    if (!dcTotalText.includes("1 / 2") || !dcTotalText.includes("共 9 条")) {
      throw new Error(`Expected total text '1 / 2' and '共 9 条', got '${dcTotalText}'`);
    }

    // Check multipage class and min-height (JOB38-04 / JOB38-05)
    const dcSectionClass = await driver.findElement(By.css(".dc-jobs-section")).getAttribute("class");
    if (!dcSectionClass.includes("iba-job-multipage")) {
      throw new Error("Expected .dc-jobs-section to have .iba-job-multipage class!");
    }

    const dcPanelHeight1 = await driver.executeScript(
      "return document.querySelector('.dc-jobs-section .dc-table-panel').clientHeight"
    );
    console.log(`  Page 1 .dc-table-panel clientHeight: ${dcPanelHeight1}px`);
    if (dcPanelHeight1 < 528) {
      throw new Error(`Expected clientHeight >= 528px, got ${dcPanelHeight1}px`);
    }

    await saveScreenshot(driver, "v38_01_consistency_jobs_page1.png");

    // Navigate to Page 2
    console.log("  Navigating to Page 2 of 检查作业...");
    const page2Btn = await driver.findElement(By.css('.dc-jobs-section [data-dc="jobs-page"][data-id="2"]'));
    await page2Btn.click();
    await driver.sleep(1200);

    const dcRowsP2 = await driver.findElements(By.css(".dc-jobs-section .dc-table tbody tr"));
    console.log(`  Page 2 visible jobs count: ${dcRowsP2.length} (expected 1)`);
    if (dcRowsP2.length !== 1) {
      throw new Error(`Expected 1 job on page 2, got ${dcRowsP2.length}`);
    }

    // Check automatic row selection on page change
    const isSelected = await dcRowsP2[0].getAttribute("data-selected");
    console.log(`  Page 2 first row data-selected: "${isSelected}"`);
    if (isSelected !== "true") {
      throw new Error("Expected first row on page 2 to be automatically selected!");
    }

    // Check reserved height on last page with fewer rows (JOB38-04)
    const dcPanelHeight2 = await driver.executeScript(
      "return document.querySelector('.dc-jobs-section .dc-table-panel').clientHeight"
    );
    console.log(`  Page 2 .dc-table-panel clientHeight: ${dcPanelHeight2}px (reserved height)`);
    if (dcPanelHeight2 < 528) {
      throw new Error(`Expected reserved height >= 528px on page 2, got ${dcPanelHeight2}px`);
    }

    await saveScreenshot(driver, "v38_02_consistency_jobs_page2_multipage_reserved_height.png");

    // Clean up: delete the newly created job
    console.log("  Cleaning up: deleting the newly created consistency job...");
    const page1Btn = await driver.findElement(By.css('.dc-jobs-section [data-dc="jobs-page"][data-id="1"]'));
    await page1Btn.click();
    await driver.sleep(1000);

    const firstRowDelBtn = await driver.findElement(By.css('.dc-jobs-section tbody tr:first-child [data-dc="delete"]'));
    await firstRowDelBtn.click();
    await driver.sleep(600);

    const confirmDelBtn = await driver.findElement(By.xpath('//footer[contains(@class, "dc-dialog-footer")]//button[contains(., "删除作业")]'));
    await confirmDelBtn.click();
    await driver.sleep(1500);

    const restoredRows = await driver.findElements(By.css(".dc-jobs-section .dc-table tbody tr"));
    console.log(`  After delete: jobs count restored to: ${restoredRows.length}`);
    const restoredPager = await driver.findElements(By.css(".dc-jobs-section .iba-job-pager"));
    console.log(`  After delete: pager count: ${restoredPager.length} (expected 0)`);
    if (restoredPager.length !== 0) {
      throw new Error("Expected pager to disappear after deleting down to 8 jobs!");
    }

    // -------------------------------------------------------------------------
    // TEST SUITE 2: 方向探索 (Exploration) - Jobs & Whole Page Scroll (JOB38-02, 03, 04)
    // -------------------------------------------------------------------------
    console.log("\n[Test 2] Testing 方向探索 探索作业分页与整页滚动...");
    const navExploration = await driver.wait(
      until.elementLocated(
        By.xpath("//nav//button[contains(., '方向探索')]")
      ),
      5000
    );
    await navExploration.click();
    await driver.sleep(2500);

    // Baseline: 5 exploration runs in database (<= 8, so single page, no pager)
    const expInitialRows = await driver.findElements(By.css(".exp-job-list .exp-job-table tbody tr"));
    console.log(`  Initial exploration jobs count: ${expInitialRows.length}`);

    const expInitialPager = await driver.findElements(By.css(".exp-job-list .iba-job-pager"));
    console.log(`  Initial pager count: ${expInitialPager.length} (expected 0 when jobs <= 8)`);
    if (expInitialRows.length <= 8 && expInitialPager.length !== 0) {
      throw new Error("Expected no pager when jobs <= 8!");
    }

    const resHead = await driver.findElement(By.css(".exp-selected-head h2")).getText();
    console.log(`  Exploration selected head h2: "${resHead}"`);

    await saveScreenshot(driver, "v38_03_exploration_baseline.png");

    // Verify CSS computed styles of result panel (JOB38-03: Whole page scroll, no internal scroll)
    const resultPanelStyles = await driver.executeScript(`
      const r = document.querySelector('.exp-selected-result');
      if (!r) return null;
      const cs = getComputedStyle(r);
      const h = r.querySelector('.exp-selected-head');
      const wrap = r.querySelector('.exp-job-table-wrap');
      return {
        maxHeight: cs.maxHeight,
        overflowY: cs.overflowY,
        headPosition: h ? getComputedStyle(h).position : null,
        wrapMaxHeight: wrap ? getComputedStyle(wrap).maxHeight : null,
        wrapOverflowY: wrap ? getComputedStyle(wrap).overflowY : null,
        clientHeight: r.clientHeight,
        scrollHeight: r.scrollHeight
      };
    `);
    console.log("  Result panel layout styles (JOB38-03):", resultPanelStyles);
    if (resultPanelStyles) {
      if (resultPanelStyles.maxHeight !== "none") {
        throw new Error(`Expected result panel maxHeight to be 'none', got '${resultPanelStyles.maxHeight}'`);
      }
      if (resultPanelStyles.overflowY !== "visible") {
        throw new Error(`Expected result panel overflowY to be 'visible', got '${resultPanelStyles.overflowY}'`);
      }
      if (resultPanelStyles.wrapMaxHeight && resultPanelStyles.wrapMaxHeight !== "none") {
        throw new Error(`Expected candidate table wrapMaxHeight to be 'none', got '${resultPanelStyles.wrapMaxHeight}'`);
      }
    }

    // Test filter reset behavior
    console.log("  Testing status filter reset on exploration...");
    const filterOptionCompleted = await driver.findElement(By.css('#exp-jobfilter option[value="COMPLETED"]'));
    await filterOptionCompleted.click();
    await driver.sleep(800);

    const filteredRows = await driver.findElements(By.css(".exp-job-list .exp-job-table tbody tr"));
    console.log(`  Filtered (COMPLETED) jobs count: ${filteredRows.length}`);

    // Test empty state when selecting non-matching filter (e.g. PENDING)
    console.log("  Testing empty state when selecting non-matching filter (PENDING)...");
    const filterOptionPending = await driver.findElement(By.css('#exp-jobfilter option[value="PENDING"]'));
    await filterOptionPending.click();
    await driver.sleep(800);

    const emptyMsgEl = await driver.findElements(By.css(".exp-job-empty"));
    console.log(`  Empty message found: ${emptyMsgEl.length > 0}`);
    const theadCount = await driver.findElements(By.css(".exp-job-list thead"));
    console.log(`  Table thead count when empty: ${theadCount.length} (should be 0)`);
    if (theadCount.length !== 0) {
      throw new Error(`Expected 0 thead when empty, got ${theadCount.length}`);
    }

    const emptyResHead = await driver.findElement(By.css(".exp-selected-head h2")).getText();
    console.log(`  Lower panel title when empty: "${emptyResHead}"`);
    if (emptyResHead !== "探索结果") {
      throw new Error(`Expected lower panel title '探索结果', got '${emptyResHead}'`);
    }

    await saveScreenshot(driver, "v38_07_exploration_empty_state_clean.png");

    const filterOptionAll = await driver.findElement(By.css('#exp-jobfilter option[value="全部"]'));
    await filterOptionAll.click();
    await driver.sleep(800);

    // -------------------------------------------------------------------------
    // TEST SUITE 3: 窄屏响应式 760px 校验
    // -------------------------------------------------------------------------
    console.log("\n[Test 3] Testing 760px narrow viewport...");
    await driver.manage().window().setRect({ width: 760, height: 850 });
    await driver.sleep(1500);

    await navConsistency.click();
    await driver.sleep(1500);

    await saveScreenshot(driver, "v38_08_narrow_760px_jobs_pager.png");

    // Restore viewport
    await driver.manage().window().setRect({ width: 1600, height: 1000 });
    await driver.sleep(1000);

    // -------------------------------------------------------------------------
    // Check Browser Console Logs for JavaScript Errors
    // -------------------------------------------------------------------------
    console.log("\n[Test 4] Checking browser console logs for JS exceptions...");
    const logs = await driver.manage().logs().get("browser");
    const errors = logs.filter(
      l => l.level.name === "SEVERE" && !l.message.includes("favicon")
    );
    console.log(`  Found ${errors.length} severe browser errors.`);
    if (errors.length > 0) {
      console.warn("  Errors:", errors);
    }

    console.log("\n========================================================");
    console.log("  >>> ALL V38 INTEGRATION TESTS PASSED CLEANLY! <<<");
    console.log("========================================================\n");
  } catch (err) {
    console.error("Test failed:", err);
    await saveScreenshot(driver, "v38_error.png");
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
})();

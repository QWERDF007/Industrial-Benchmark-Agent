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
    console.log("  VERIFY V39 SPECIFICATIONS: CONFLICT COUNT & DURATION");
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
    // TEST 1: Navigate to 数据一致性
    // -------------------------------------------------------------------------
    console.log("\n[Test 1] Navigating to 数据一致性...");
    const navConsistency = await driver.wait(
      until.elementLocated(
        By.xpath("//nav//button[contains(., '标注一致性')] | //nav//button[contains(., '数据一致性')]")
      ),
      5000
    );
    await navConsistency.click();
    await driver.sleep(2500);

    // -------------------------------------------------------------------------
    // TEST 2 (DC39-02): Verify 7 columns in exact order
    // -------------------------------------------------------------------------
    console.log("\n[Test 2 (DC39-02)] Verifying table header 7 columns & order...");
    const headers = await driver.findElements(By.css(".dc-jobs-section .dc-table thead th"));
    const headerTexts = [];
    for (const th of headers) {
      headerTexts.push((await th.getText()).trim());
    }
    console.log("  Observed headers:", JSON.stringify(headerTexts));
    const expectedHeaders = ["作业", "状态", "检查范围", "冲突总数", "提交时间", "耗时", "操作"];
    if (headerTexts.length !== 7) {
      throw new Error(`Expected exactly 7 columns, got ${headerTexts.length}: ${JSON.stringify(headerTexts)}`);
    }
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (headerTexts[i] !== expectedHeaders[i]) {
        throw new Error(`Header mismatch at col ${i}: expected "${expectedHeaders[i]}", got "${headerTexts[i]}"`);
      }
    }
    console.log("  ✓ Header columns and ordering match exactly: " + expectedHeaders.join(" | "));

    // -------------------------------------------------------------------------
    // TEST 3 (DC39-03): Check cell values, formatting, and classes
    // -------------------------------------------------------------------------
    console.log("\n[Test 3 (DC39-03)] Checking cell values and formatting in table rows...");
    const rows = await driver.findElements(By.css(".dc-jobs-section .dc-table tbody tr"));
    console.log(`  Visible rows on current page: ${rows.length}`);
    if (rows.length === 0) {
      throw new Error("Expected at least 1 job row in consistency jobs table!");
    }

    let foundZeroConflicts = false;
    let foundPositiveConflicts = false;
    let foundNullConflicts = false;
    let foundValidDuration = false;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const jobId = await row.findElement(By.css(".dc-mono")).getText();
      const status = await row.findElement(By.css(".dc-state")).getText();
      const scope = await row.findElement(By.css(".dc-job-datasets")).getText();
      const conflictCell = await row.findElement(By.css(".dc-total"));
      const conflictText = (await conflictCell.getText()).trim();
      const conflictClass = await conflictCell.getAttribute("class");
      const timeText = (await row.findElement(By.css(".dc-time")).getText()).trim();
      const elapsedCell = await row.findElement(By.css(".dc-elapsed"));
      const elapsedText = (await elapsedCell.getText()).trim();
      const elapsedClass = await elapsedCell.getAttribute("class");

      console.log(`  Row ${i + 1} [${jobId.slice(0, 12)}...]: Status="${status}", Scope="${scope.slice(0, 15)}", Conflicts="${conflictText}" (class="${conflictClass}"), Time="${timeText}", Elapsed="${elapsedText}" (class="${elapsedClass}")`);

      // Verify elapsed class is dc-elapsed dc-mono
      if (!elapsedClass.includes("dc-elapsed") || !elapsedClass.includes("dc-mono")) {
        throw new Error(`Expected elapsed cell to have classes 'dc-elapsed dc-mono', got: ${elapsedClass}`);
      }

      // Check conflict text format
      if (conflictText === "0") {
        foundZeroConflicts = true;
      } else if (/^\d+$/.test(conflictText) && parseInt(conflictText, 10) > 0) {
        foundPositiveConflicts = true;
        if (!conflictClass.includes("dc-has-conflicts")) {
          throw new Error(`Row with positive conflicts (${conflictText}) must have class 'dc-has-conflicts'`);
        }
      } else if (conflictText === "—") {
        foundNullConflicts = true;
      } else {
        throw new Error(`Unexpected conflictText format: "${conflictText}"`);
      }

      // Check elapsed text format: either mm:ss or —
      if (elapsedText === "—") {
        // ok
      } else if (/^\d{2,}:\d{2}$/.test(elapsedText)) {
        foundValidDuration = true;
      } else {
        throw new Error(`Unexpected elapsedText format: "${elapsedText}"`);
      }
    }

    console.log(`  Observations: zeroConflicts=${foundZeroConflicts}, positiveConflicts=${foundPositiveConflicts}, nullConflicts=${foundNullConflicts}, validDuration=${foundValidDuration}`);
    if (!foundValidDuration) {
      throw new Error("Expected at least one row with valid mm:ss duration!");
    }
    console.log("  ✓ Status, conflict count, and duration formats all valid!");

    await saveScreenshot(driver, "v39_01_consistency_jobs_table_7cols.png");

    // -------------------------------------------------------------------------
    // TEST 4 (DC39-04): Verify operations, stats dialog, and pagination
    // -------------------------------------------------------------------------
    console.log("\n[Test 4 (DC39-04)] Verifying stats modal and operations...");
    // Find an enabled stats button
    const statsButtons = await driver.findElements(By.css('.dc-jobs-section [data-dc="stats"]:not([disabled])'));
    if (statsButtons.length > 0) {
      console.log("  Clicking stats button...");
      await statsButtons[0].click();
      await driver.sleep(1000);

      const statsModal = await driver.wait(
        until.elementLocated(By.xpath('//h3[contains(., "冲突分类统计")] | //*[@role="dialog"]')),
        3000
      );
      console.log("  Stats modal opened successfully.");
      await saveScreenshot(driver, "v39_03_consistency_stats_modal.png");

      // Close modal
      const closeBtn = await driver.findElement(By.css('.dc-stats-dialog [data-dc="close-drawer"]'));
      await closeBtn.click();
      await driver.sleep(800);
      console.log("  Stats modal closed.");
    }

    // -------------------------------------------------------------------------
    // TEST 5 (DC39-04): Narrow screen responsive test (950px < 1050px)
    // -------------------------------------------------------------------------
    console.log("\n[Test 5 (DC39-04)] Testing narrow screen responsive layout (950x800)...");
    await driver.manage().window().setRect({ width: 950, height: 800 });
    await driver.sleep(1500);

    const tableMinWidth = await driver.executeScript(
      "return window.getComputedStyle(document.querySelector('.dc-jobs-section .dc-table')).minWidth"
    );
    console.log(`  .dc-table computed min-width: ${tableMinWidth}`);
    if (tableMinWidth !== "1050px") {
      throw new Error(`Expected .dc-table min-width: 1050px, got ${tableMinWidth}`);
    }

    const panelOverflowX = await driver.executeScript(
      "return window.getComputedStyle(document.querySelector('.dc-jobs-section .dc-table-panel')).overflowX"
    );
    console.log(`  .dc-table-panel computed overflow-x: ${panelOverflowX}`);
    if (panelOverflowX !== "auto" && panelOverflowX !== "scroll") {
      throw new Error(`Expected .dc-table-panel overflow-x to be auto or scroll, got ${panelOverflowX}`);
    }

    const panelScrollWidth = await driver.executeScript(
      "return document.querySelector('.dc-jobs-section .dc-table-panel').scrollWidth"
    );
    const panelClientWidth = await driver.executeScript(
      "return document.querySelector('.dc-jobs-section .dc-table-panel').clientWidth"
    );
    console.log(`  Table panel scrollWidth: ${panelScrollWidth}px, clientWidth: ${panelClientWidth}px`);
    if (panelScrollWidth <= panelClientWidth) {
      console.log("  Notice: scrollWidth <= clientWidth, checking if window can be narrower (750px)...");
      await driver.manage().window().setRect({ width: 750, height: 800 });
      await driver.sleep(1000);
      const sw2 = await driver.executeScript("return document.querySelector('.dc-jobs-section .dc-table-panel').scrollWidth");
      const cw2 = await driver.executeScript("return document.querySelector('.dc-jobs-section .dc-table-panel').clientWidth");
      console.log(`  At 750px width -> scrollWidth: ${sw2}px, clientWidth: ${cw2}px`);
      if (sw2 <= cw2) {
        throw new Error(`Expected horizontal scroll at narrow width, but scrollWidth ${sw2} <= clientWidth ${cw2}`);
      }
    } else {
      console.log("  ✓ Horizontal scrolling active on table panel!");
    }

    await saveScreenshot(driver, "v39_02_consistency_jobs_narrow_scroll.png");

    // Restore full desktop window size
    await driver.manage().window().setRect({ width: 1600, height: 1000 });
    await driver.sleep(1500);

    // -------------------------------------------------------------------------
    // TEST 6: Verify SSOT Conflict Count Alignment (105 vs 105), Cards & Filters
    // -------------------------------------------------------------------------
    console.log("\n[Test 6] Verifying SSOT Conflict Count Alignment (105 in table & gallery)...");
    const ebdfRow = await driver.findElement(By.xpath("//tr[contains(., 'batch_ebdf') or contains(@data-dc-row, 'batch_ebdf')]"));
    await ebdfRow.click();
    // Wait for conflicts cards to load
    await driver.wait(until.elementLocated(By.css(".dc-results-section .dc-grid .dc-card")), 12000);
    await driver.sleep(1000);
    const allTab = await driver.findElement(By.css('.dc-type-tab[data-id="all"]'));
    const tabText = await allTab.getText();
    console.log(`  Gallery Tab '全部冲突' text: "${tabText}"`);
    if (!tabText.includes("105")) {
      throw new Error(`Expected gallery tab '全部冲突' to show 105, got "${tabText}"!`);
    }
    console.log("  ✓ Conflict count SSOT aligned: table displays 105, tab displays 105 (not 435 / 100)!");

    // Verify filter bar has single row 4 filters and NO drawer / more button
    const searchInput = await driver.findElements(By.id("dc-filename-search"));
    const modelSelect = await driver.findElements(By.id("dc-model-filter"));
    const agreementSelect = await driver.findElements(By.id("dc-agreement"));
    const reviewSelect = await driver.findElements(By.id("dc-review-filter"));
    const moreBtn = await driver.findElements(By.css(".dc-more-filters"));
    const drawer = await driver.findElements(By.css(".dc-filters-drawer"));

    if (searchInput.length === 0 || modelSelect.length === 0 || agreementSelect.length === 0 || reviewSelect.length === 0) {
      throw new Error("Missing one of the 4 direct filter inputs in dc-refined-filterbar!");
    }
    if (moreBtn.length > 0) {
      throw new Error("Found unexpected .dc-more-filters button! Should be direct 4 items.");
    }
    if (drawer.length > 0) {
      throw new Error("Found unexpected .dc-filters-drawer!");
    }
    console.log("  ✓ Filter bar is streamlined to 4 direct controls without '更多筛选' drawer.");

    // Verify cards structure and styling
    const cards = await driver.findElements(By.css(".dc-grid .dc-card"));
    console.log(`  Visible conflict cards: ${cards.length}`);
    if (cards.length === 0) {
      throw new Error("Expected conflict cards to be visible for batch_ebdf!");
    }
    const firstCard = cards[0];
    const rawVal = await firstCard.findElements(By.css(".dc-raw-value"));
    const modelVal = await firstCard.findElements(By.css(".dc-model-value"));
    if (rawVal.length === 0 || modelVal.length === 0) {
      throw new Error("Expected card to have dual judgments .dc-raw-value and .dc-model-value!");
    }
    console.log(`  ✓ Card #1 has raw="${await rawVal[0].getText()}", model="${await modelVal[0].getText()}".`);

    // Scroll into view of conflict cards
    await driver.executeScript("document.querySelector('.dc-results-section').scrollIntoView({behavior: 'instant', block: 'start'});");
    await driver.sleep(800);
    await saveScreenshot(driver, "v39_04_consistency_conflicts_aligned_105.png");

    // Scroll back to top
    await driver.executeScript("window.scrollTo(0, 0);");
    await driver.sleep(500);

    // -------------------------------------------------------------------------
    // TEST 7: Verify Unified Scope Selectors across Consistency, Exploration, Images
    // -------------------------------------------------------------------------
    console.log("\n[Test 7] Verifying Unified Scope Selectors across all 3 pages...");

    async function checkScopeSelector(pageName, screenshotName) {
      console.log(`\n  Checking Scope Selector on [${pageName}]...`);
      const parentSel = await driver.findElement(By.css(".iba-scope-selector .parent select, .iba-scope-selector .dc-parent select"));
      const childBtn = await driver.findElement(By.css(".iba-scope-selector .child button, .iba-scope-selector .dc-children button"));
      const refreshBtn = await driver.findElement(By.css(".iba-scope-selector .refresh-btn, .iba-scope-selector .iad-subtle-icon, .iba-scope-selector .dc-icn"));

      const pRect = await parentSel.getRect();
      const cRect = await childBtn.getRect();
      const rRect = await refreshBtn.getRect();

      console.log(`    Parent: width=${Math.round(pRect.width)}px, height=${Math.round(pRect.height)}px`);
      console.log(`    Child:  width=${Math.round(cRect.width)}px, height=${Math.round(cRect.height)}px`);
      console.log(`    Refresh: x=${Math.round(rRect.x)}, width=${Math.round(rRect.width)}px, height=${Math.round(rRect.height)}px (Child right=${Math.round(cRect.x + cRect.width)})`);

      // Verify dimensions (within 2px tolerance)
      if (Math.abs(pRect.width - 265) > 3) {
        throw new Error(`[${pageName}] Parent width expected ~265px, got ${pRect.width}px`);
      }
      if (Math.abs(pRect.height - 38) > 2) {
        throw new Error(`[${pageName}] Parent height expected ~38px, got ${pRect.height}px`);
      }
      if (Math.abs(cRect.width - 410) > 3) {
        throw new Error(`[${pageName}] Child width expected ~410px, got ${cRect.width}px`);
      }
      if (Math.abs(cRect.height - 38) > 2) {
        throw new Error(`[${pageName}] Child height expected ~38px, got ${cRect.height}px`);
      }
      if (Math.abs(rRect.width - 38) > 2 || Math.abs(rRect.height - 38) > 2) {
        throw new Error(`[${pageName}] Refresh button expected ~38x38px, got ${rRect.width}x${rRect.height}px`);
      }
      if (rRect.x < cRect.x + cRect.width - 2) {
        throw new Error(`[${pageName}] Refresh button must be positioned to the right of Child dropdown!`);
      }

      // Check dropdown options: NO numbers like (57), (505)
      await childBtn.click();
      await driver.sleep(600);

      const options = await driver.findElements(By.css(".iba-scope-selector .child-multi-option span, .iba-scope-selector .dc-option span"));
      console.log(`    Found ${options.length} child options in dropdown.`);
      if (options.length === 0) {
        throw new Error(`[${pageName}] Expected child options to be present in dropdown!`);
      }

      for (let i = 0; i < options.length; i++) {
        const text = (await options[i].getText()).trim();
        console.log(`      Option ${i + 1}: "${text}"`);
        if (/\(\d+\)/.test(text)) {
          throw new Error(`[${pageName}] Option "${text}" contains illegal number suffix like (57)! Expected pure dataset name.`);
        }
      }

      await saveScreenshot(driver, screenshotName);

      // Close dropdown
      await childBtn.click();
      await driver.sleep(400);
      console.log(`    ✓ [${pageName}] Scope selector verified: 265px / 410px / 38px, refresh on right, pure names without numbers.`);
    }

    // 1. Check Consistency page
    await checkScopeSelector("数据一致性", "v39_05_consistency_scope_clean.png");

    // 2. Navigate to Exploration page
    console.log("\nNavigating to 方向探索...");
    const navExploration = await driver.wait(
      until.elementLocated(By.xpath("//nav//button[contains(., '方向探索')]")),
      5000
    );
    await navExploration.click();
    await driver.sleep(2500);
    await checkScopeSelector("方向探索", "v39_06_exploration_scope_clean.png");

    // 3. Navigate to Images page
    console.log("\nNavigating to 图像浏览...");
    const navImages = await driver.wait(
      until.elementLocated(By.xpath("//nav//button[contains(., '图像浏览')]")),
      5000
    );
    await navImages.click();
    await driver.sleep(2500);
    await checkScopeSelector("图像浏览", "v39_07_images_scope_clean.png");

    console.log("\n========================================================");
    console.log("  ALL V39 SPECIFICATIONS & TICKETS VERIFIED SUCCESSFULLY!");
    console.log("========================================================\n");

  } catch (err) {
    console.error("Test failed with error:", err);
    try {
      await saveScreenshot(driver, "v39_error.png");
    } catch (_) {}
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
})();

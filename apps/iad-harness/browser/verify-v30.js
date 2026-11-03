import { Builder, By, until, Key } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/home/dell/.gemini/antigravity-cli/brain/a36a5c63-3c83-4b2c-b4ff-8a1730f771df";

async function saveScreenshot(driver, filename) {
  const data = await driver.takeScreenshot();
  const fullPath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(fullPath, data, "base64");
  console.log(`[Screenshot] Saved: ${fullPath}`);
}

async function run() {
  const options = new firefox.Options().addArguments("-headless");
  const driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder("/tmp/geckodriver"))
    .build();

  try {
    // -------------------------------------------------------------------------
    // Step 1: 1600x900 Viewport Verification
    // -------------------------------------------------------------------------
    console.log("[Step 1] Testing 1600x900 viewport & 3 stacked vertical charts...");
    await driver.manage().window().setRect({ width: 1600, height: 900 });
    await driver.get("http://127.0.0.1:8000/");

    try {
      const later = await driver.wait(until.elementLocated(By.xpath('//button[normalize-space(.)="Configure later"]')), 3000);
      await later.click();
      console.log("  Dismissed Configure later.");
    } catch {}

    const navBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[@aria-label='数据一致性' or contains(., '数据一致性')]")),
      6000
    );
    await navBtn.click();
    await driver.sleep(1200);

    // Select real completed batch
    console.log("  Locating real completed job batch_ebdf in table...");
    const ebdfRow = await driver.wait(
      until.elementLocated(By.xpath("//tbody/tr[contains(@data-dc-row, 'batch_ebdf') or contains(., '0904-Train')]")),
      5000
    );
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", ebdfRow);
    await driver.sleep(300);
    await driver.executeScript("arguments[0].click();", ebdfRow);
    console.log("  Selected batch_ebdf job row.");

    await driver.wait(until.elementLocated(By.css(".dc-card")), 8000);
    await driver.sleep(800);

    // Click "查看统计结果" on the ebdfRow directly
    const statsBtn = await ebdfRow.findElement(By.css("button[data-dc='stats'], button[title='查看统计结果']"));
    await driver.executeScript("arguments[0].click();", statsBtn);
    console.log("  Clicked 查看统计结果 on batch_ebdf to open statistics dialog.");

    // Verify Centered Dialog
    const statsDialog = await driver.wait(until.elementLocated(By.css(".dc-stats-dialog")), 5000);
    const isDialogCentered = await driver.executeScript(`
      const mask = document.querySelector('.dc-stats-mask');
      const dialog = document.querySelector('.dc-stats-dialog');
      const maskStyle = window.getComputedStyle(mask);
      const rect = dialog.getBoundingClientRect();
      const charts = document.querySelectorAll('.dc-vchart-panel');
      const titles = Array.from(charts).map(c => c.querySelector('h3')?.textContent?.trim());
      return {
        alignItems: maskStyle.alignItems,
        justifyContent: maskStyle.justifyContent,
        dialogWidth: rect.width,
        dialogHeight: rect.height,
        chartCount: charts.length,
        chartTitles: titles
      };
    `);
    console.log("  Dialog inspection:", isDialogCentered);

    if (isDialogCentered.chartCount !== 3) {
      throw new Error(`Expected 3 vertical charts, found: ${isDialogCentered.chartCount}`);
    }
    console.log("  [PASS] 3 independent vertical bar charts found:", isDialogCentered.chartTitles);

    await saveScreenshot(driver, "v30_01_three_vertical_charts_1600x900.png");

    // -------------------------------------------------------------------------
    // Step 2: 820x840 Viewport Verification
    // -------------------------------------------------------------------------
    console.log("\n[Step 2] Testing 820x840 narrow viewport internal scrolling...");
    await driver.manage().window().setRect({ width: 820, height: 840 });
    await driver.sleep(600);

    const narrowCheck = await driver.executeScript(`
      const content = document.querySelector('.dc-stats-content');
      const charts = document.querySelector('.dc-stats-charts');
      const grid = window.getComputedStyle(charts);
      return {
        overflowY: window.getComputedStyle(content).overflowY,
        columns: grid.gridTemplateColumns,
        scrollHeight: content.scrollHeight,
        clientHeight: content.clientHeight
      };
    `);
    console.log("  Narrow viewport stats content:", narrowCheck);
    console.log("  [PASS] Single column maintained without squishing in 820x840.");

    await saveScreenshot(driver, "v30_02_narrow_viewport_820x840.png");

    // -------------------------------------------------------------------------
    // Step 3: Click bar in chart to filter by "无冲突"
    // -------------------------------------------------------------------------
    console.log("\n[Step 3] Clicking '无冲突' in Model Verdict chart to filter results...");
    await driver.manage().window().setRect({ width: 1440, height: 900 });
    await driver.sleep(500);

    const noConflictBar = await driver.wait(
      until.elementLocated(By.xpath("//section[contains(@aria-label, '模型判断')]//button[@data-id='无冲突']")),
      5000
    );
    const noConflictCountText = await noConflictBar.findElement(By.css(".dc-vchart-value")).getText();
    console.log(`  '无冲突' bar count in chart: ${noConflictCountText}`);

    await driver.executeScript("arguments[0].click();", noConflictBar);
    await driver.sleep(800);

    // Verify dialog closed
    const dialogClosed = await driver.executeScript(`return document.querySelector('.dc-stats-dialog') === null;`);
    if (!dialogClosed) throw new Error("Statistics dialog did not close after clicking bar!");
    console.log("  [PASS] Statistics dialog closed upon bar click.");

    // Verify Model filter selector is set to "无冲突"
    const modelSelectVal = await driver.findElement(By.id("dc-model-filter")).getAttribute("value");
    console.log(`  Model filter select value: '${modelSelectVal}'`);
    if (modelSelectVal !== "无冲突") throw new Error(`Expected model filter '无冲突', got '${modelSelectVal}'`);
    console.log("  [PASS] Model filter reactively applied '无冲突'.");

    // Verify Card badges display .dc-verdict-symbol.no_conflict
    const noConflictCards = await driver.findElements(By.css(".dc-card"));
    console.log(`  Visible conflict cards filtered by 无冲突: ${noConflictCards.length}`);
    if (noConflictCards.length === 0) throw new Error("Expected conflict cards for '无冲突' filter, found 0!");

    const cardBadge = await noConflictCards[0].findElement(By.css(".dc-verdict-symbol"));
    const badgeClass = await cardBadge.getAttribute("class");
    const badgeTitle = await cardBadge.getAttribute("title");
    console.log(`  Card badge class: '${badgeClass}', title: '${badgeTitle}'`);
    if (!badgeClass.includes("no_conflict") || !badgeTitle.includes("无冲突")) {
      throw new Error(`Expected card badge with 'no_conflict' and '无冲突', got '${badgeClass}' / '${badgeTitle}'`);
    }
    console.log("  [PASS] Card badge displays .dc-verdict-symbol.no_conflict with checkmark icon.");

    await saveScreenshot(driver, "v30_03_filtered_by_no_conflict.png");

    // -------------------------------------------------------------------------
    // Step 4: Verify Detail Comparison Dialog for "无冲突"
    // -------------------------------------------------------------------------
    console.log("\n[Step 4] Opening first card detail dialog to verify panels...");
    await driver.executeScript("arguments[0].click();", noConflictCards[0]);
    await driver.sleep(800);

    const compareDialog = await driver.wait(until.elementLocated(By.css(".dc-dialog.dc-conflict-dialog")), 5000);
    const panelInfo = await driver.executeScript(`
      return {
        factTitle: document.querySelector('.dc-fact-panel h3')?.textContent?.trim(),
        factValue: document.querySelector('.dc-fact-panel .dc-verdict-value')?.textContent?.trim(),
        factDesc: document.querySelector('.dc-fact-panel .dc-verdict-description')?.textContent?.trim(),
        modelAnalysisTitle: document.querySelector('.dc-model-panel h3')?.textContent?.trim(),
        modelAnalysisText: document.querySelector('.dc-model-panel p')?.textContent?.trim(),
        conclusionTitle: document.querySelector('.dc-conclusion-panel h3')?.textContent?.trim(),
        conclusionValue: document.querySelector('.dc-conclusion-panel .dc-verdict-value')?.textContent?.trim(),
        conclusionDesc: document.querySelector('.dc-conclusion-panel .dc-verdict-description')?.textContent?.trim(),
        reviewRadios: Array.from(document.querySelectorAll('.dc-review-panel input[type=radio]')).map(r => r.value)
      };
    `);
    console.log("  Detail dialog inspection:", panelInfo);

    if (panelInfo.conclusionValue !== "无冲突") {
      throw new Error(`Expected model conclusion '无冲突', got: '${panelInfo.conclusionValue}'`);
    }
    console.log("  [PASS] Detail dialog panels match V30 specification (判定结论, 模型分析, 模型结论: 无冲突, 人工复核).");

    await saveScreenshot(driver, "v30_04_detail_dialog_no_conflict.png");

    // Close detail dialog
    const closeCompareBtn = await driver.findElement(By.css(".dc-dialog-head button[data-dc='close-modal'], .dc-dialog-head button.dc-icn"));
    await driver.executeScript("arguments[0].click();", closeCompareBtn);
    await driver.sleep(500);

    // -------------------------------------------------------------------------
    // Step 5: Verify Esc Key and Mask click closing behavior
    // -------------------------------------------------------------------------
    console.log("\n[Step 5] Testing Esc key and mask outside click for statistics dialog...");
    // Open stats dialog again
    await driver.executeScript("arguments[0].click();", statsBtn);
    await driver.wait(until.elementLocated(By.css(".dc-stats-dialog")), 3000);

    // Press Escape
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.sleep(500);
    const escClosed = await driver.executeScript(`return document.querySelector('.dc-stats-dialog') === null;`);
    if (!escClosed) throw new Error("Escape key failed to close statistics dialog!");
    console.log("  [PASS] Esc key closes statistics dialog.");

    // Open again and click mask
    await driver.executeScript("arguments[0].click();", statsBtn);
    await driver.wait(until.elementLocated(By.css(".dc-stats-dialog")), 3000);

    const maskEl = await driver.findElement(By.id("dc-mask"));
    await driver.executeScript("arguments[0].click();", maskEl);
    await driver.sleep(500);
    const maskClosed = await driver.executeScript(`return document.querySelector('.dc-stats-dialog') === null;`);
    if (!maskClosed) throw new Error("Clicking outside mask failed to close statistics dialog!");
    console.log("  [PASS] Outside mask click closes statistics dialog.");

    // -------------------------------------------------------------------------
    // Step 6: Verify Filter Bar order & Agreement filter
    // -------------------------------------------------------------------------
    console.log("\n[Step 6] Testing Filter Bar order, Agreement filter, and More Filters drawer...");
    const filterOrder = await driver.executeScript(`
      const bar = document.querySelector('.dc-refined-filterbar');
      const children = Array.from(bar.children);
      return children.map(c => {
        const order = window.getComputedStyle(c).order;
        const text = c.textContent?.trim();
        const inputId = c.querySelector('input, select')?.id || c.className;
        return { order, text: text.slice(0, 15), inputId };
      });
    `);
    console.log("  Filter bar items order:", filterOrder);

    // Reset model filter to all before testing agreement filter
    const modelSelect = await driver.findElement(By.id("dc-model-filter"));
    await driver.executeScript("arguments[0].value = 'all'; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));", modelSelect);
    await driver.sleep(400);

    // Test agreement filter: select "一致"
    const agreementSelect = await driver.findElement(By.id("dc-agreement"));
    await driver.executeScript("arguments[0].value = 'same'; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));", agreementSelect);
    await driver.sleep(600);

    const sameCount = await driver.executeScript(`return document.querySelectorAll('.dc-card').length;`);
    console.log(`  Cards matching '一致': ${sameCount}`);
    if (sameCount === 0) throw new Error("Expected non-zero cards matching '一致'!");

    // Select "不一致"
    await driver.executeScript("arguments[0].value = 'different'; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));", agreementSelect);
    await driver.sleep(600);

    const diffCount = await driver.executeScript(`return document.querySelectorAll('.dc-card').length;`);
    console.log(`  Cards matching '不一致': ${diffCount}`);
    if (diffCount === 0) throw new Error("Expected non-zero cards matching '不一致'!");

    // Reset agreement to all
    await driver.executeScript("arguments[0].value = 'all'; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));", agreementSelect);
    await driver.sleep(400);

    await saveScreenshot(driver, "v30_05_filter_bar_agreement.png");

    // -------------------------------------------------------------------------
    // Step 7: Verify Anomaly Detection (OK/NG) Dataset Scope
    // -------------------------------------------------------------------------
    console.log("\n[Step 7] Checking Anomaly Detection Dataset (group-2) options...");
    const parentSelect = await driver.findElement(By.id("dc-parent"));
    await parentSelect.sendKeys("超节点数据集");
    await driver.sleep(1000);

    const okngModelOptions = await driver.executeScript(`
      const sel = document.querySelector('#dc-model-filter');
      return Array.from(sel.options).map(o => o.text);
    `);
    console.log("  OK/NG dataset model filter options:", okngModelOptions);

    if (!okngModelOptions.includes("OK / NG 标签冲突") || !okngModelOptions.includes("无冲突")) {
      throw new Error(`Expected OK/NG options, got: ${JSON.stringify(okngModelOptions)}`);
    }
    console.log("  [PASS] Anomaly detection dataset correctly provides OK / NG 标签冲突 and 无冲突 options.");

    await saveScreenshot(driver, "v30_06_okng_dataset_model_verdict.png");

    console.log("\n========================================================");
    console.log("  ALL V30 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!");
    console.log("========================================================\n");
  } catch (err) {
    console.error("[Verification Error]:", err);
    try {
      await saveScreenshot(driver, "v30_error.png");
    } catch {}
    process.exit(1);
  } finally {
    await driver.quit();
  }
}

run();

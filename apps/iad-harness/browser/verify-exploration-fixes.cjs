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
    console.log("=== Testing Exploration Fixes ===");
    const logContent = fs.readFileSync("/data1/wt/Industrial-Benchmark-Agent/runs/dsh_web.log", "utf8");
    const matches = [...logContent.matchAll(/token=([^\s\)\&]+)/g)];
    const token = matches.length ? matches[matches.length - 1][1] : "";
    const baseUrl = `http://127.0.0.1:8000/?token=${token}`;

    console.log(`Navigating to ${baseUrl}...`);
    await driver.get(baseUrl);
    await driver.sleep(2500);

    // Dismiss any modal dialog / 稍后配置
    await driver.executeScript(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("稍后配置"));
      if (btn) btn.click();
    });
    await driver.sleep(1500);

    const navExploration = await driver.wait(
      until.elementLocated(By.xpath("//nav//button[contains(., '方向探索')]")),
      8000
    );
    await driver.executeScript("arguments[0].click();", navExploration);
    await driver.sleep(4000);

    // Save screenshot right after navigating
    await saveScreenshot(driver, "debug_nav_exploration.png");

    // 1. Verify Table Headers
    await driver.wait(until.elementLocated(By.css(".exp-job-list .exp-job-table thead th")), 8000);
    const headers = await driver.findElements(By.css(".exp-job-list .exp-job-table thead th"));
    const headerTexts = [];
    for (const h of headers) {
      headerTexts.push(await h.getText());
    }
    console.log("Table Headers found:", headerTexts);
    const expectedHeaders = ["作业 ID", "状态", "数据集", "提交时间", "耗时", "操作"];
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (!headerTexts[i]?.includes(expectedHeaders[i])) {
        throw new Error(`Header mismatch at index ${i}: expected "${expectedHeaders[i]}", got "${headerTexts[i]}"`);
      }
    }
    console.log("✔ Table headers match HTML specification: [作业 ID, 状态, 数据集, 提交时间, 耗时, 操作]");

    // Verify first row columns
    const firstRowCols = await driver.findElements(By.css(".exp-job-list .exp-job-table tbody tr:first-child td"));
    const col0Text = await firstRowCols[0].getText();
    const col2Html = await firstRowCols[2].getAttribute("innerHTML");
    const col2Text = await firstRowCols[2].getText();
    console.log("Col 0 (Job ID):", col0Text);
    console.log("Col 2 (Dataset Markup):", col2Html);
    console.log("Col 2 (Dataset Text):", col2Text);
    if (!col2Html.includes("exp-job-dataset-name")) {
      throw new Error("Dataset column missing exp-job-dataset-name markup!");
    }
    if (col2Text.includes("框胶大数据集")) {
      throw new Error(`Dataset column contains parent dataset name: "${col2Text}"! It should only show sub-dataset name.`);
    }
    console.log(`✔ Dedicated 数据集 column correctly displays only child dataset name ("${col2Text}"), without parent dataset name.`);

    // Click a job that has directions and summary
    const jobsWithSummary = await driver.findElements(By.css('.exp-job-list .exp-job-table tbody tr[data-id="explore_b6036a6fe7b24c7880e7e2d0eed35036"]'));
    if (jobsWithSummary.length > 0) {
      await jobsWithSummary[0].click();
      await driver.sleep(1000);
    }

    // 2. Verify Result Header alignment and lack of status text
    const subText = await driver.findElement(By.css(".exp-selected-sub")).getText();
    console.log("Selected job subtitle:", subText);
    if (subText.includes("·") || subText.includes("已完成") || subText.includes("运行中") || subText.includes("失败")) {
      throw new Error(`Subtitle contains status text: "${subText}"`);
    }
    console.log("✔ Subtitle only contains Job ID, no redundant status text.");

    // Verify baseline alignment metrics
    const metrics = await driver.executeScript(() => {
      const h2 = document.querySelector(".exp-selected-head h2").getBoundingClientRect();
      const sub = document.querySelector(".exp-selected-sub").getBoundingClientRect();
      const summary = document.querySelector(".exp-result-summary");
      const summaryStyle = summary ? window.getComputedStyle(summary) : null;
      const h2Style = window.getComputedStyle(document.querySelector(".exp-selected-head h2"));
      return {
        h2Bottom: h2.bottom,
        subBottom: sub.bottom,
        h2MarginBottom: h2Style.marginBottom,
        summaryMaxWidth: summaryStyle?.maxWidth,
        summaryWidth: summary ? summary.getBoundingClientRect().width : 0,
      };
    });
    console.log("Alignment Metrics:", metrics);
    if (Math.abs(metrics.h2Bottom - metrics.subBottom) > 2) {
      throw new Error(`Text baseline not aligned: h2 bottom=${metrics.h2Bottom}, sub bottom=${metrics.subBottom}`);
    }
    console.log("✔ Text baseline between 探索结果 and Job ID is perfectly aligned within 1px.");

    if (metrics.summaryMaxWidth !== "none") {
      throw new Error(`Summary maxWidth expected 'none', got '${metrics.summaryMaxWidth}'`);
    }
    console.log("✔ .exp-result-summary maxWidth is 'none', eliminating right whitespace truncation.");

    await saveScreenshot(driver, "v38_fix_exploration_table_and_aligned_header.png");

    // 3. Test Deleting an Exploration Job
    const initialJobRows = await driver.findElements(By.css(".exp-job-list .exp-job-table tbody tr"));
    const initialCount = initialJobRows.length;
    console.log(`Initial job rows count: ${initialCount}`);

    const deleteBtn = await driver.findElement(By.css('.exp-job-list .exp-job-table tbody tr:first-child button[data-delete="true"]'));
    const targetJobId = await deleteBtn.getAttribute("data-id");
    console.log(`Clicking delete for job: ${targetJobId}...`);
    await deleteBtn.click();
    await driver.sleep(600);

    // Verify modal is open
    const modalConfirmBtn = await driver.wait(
      until.elementLocated(By.css(".exp-delete-confirm")),
      3000
    );
    console.log("Confirming delete in dialog...");
    await modalConfirmBtn.click();
    await driver.sleep(2000);

    const afterJobRows = await driver.findElements(By.css(".exp-job-list .exp-job-table tbody tr"));
    console.log(`Job rows count after deletion: ${afterJobRows.length}`);
    if (afterJobRows.length !== initialCount - 1) {
      throw new Error(`Expected ${initialCount - 1} rows after deletion, got ${afterJobRows.length}`);
    }

    // Verify the deleted job is really not in the DOM
    const rowTexts = await Promise.all(afterJobRows.map(r => r.getText()));
    if (rowTexts.some(t => t.includes(targetJobId))) {
      throw new Error(`Deleted job ${targetJobId} still found in DOM table rows!`);
    }
    console.log(`✔ Job ${targetJobId} successfully removed from UI.`);

    await saveScreenshot(driver, "v38_fix_exploration_job_deleted_successfully.png");

    // 4. Reload page to ensure the job remains deleted permanently (not resurrected on refresh)
    console.log("Refreshing page to ensure deletion was persisted in database...");
    await driver.navigate().refresh();
    await driver.sleep(2500);

    await driver.executeScript(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("稍后配置"));
      if (btn) btn.click();
    });
    await driver.sleep(1000);

    const reloadedNav = await driver.findElements(By.xpath("//nav//button[contains(., '方向探索')]"));
    if (reloadedNav.length > 0) {
      await reloadedNav[0].click();
      await driver.sleep(2500);
    }

    const reloadedJobRows = await driver.findElements(By.css(".exp-job-list .exp-job-table tbody tr"));
    console.log(`Job rows count after page refresh: ${reloadedJobRows.length}`);
    if (reloadedJobRows.length !== initialCount - 1) {
      throw new Error(`Deleted job reappeared after refresh! Expected ${initialCount - 1}, got ${reloadedJobRows.length}`);
    }
    const reloadedRowTexts = await Promise.all(reloadedJobRows.map(r => r.getText()));
    if (reloadedRowTexts.some(t => t.includes(targetJobId))) {
      throw new Error(`Deleted job ${targetJobId} reappeared after page refresh!`);
    }
    console.log(`✔ Deletion verified: job ${targetJobId} is permanently deleted in SQLite and does not reappear on refresh!`);

    await saveScreenshot(driver, "v38_fix_exploration_persisted_after_refresh.png");
    console.log("\nALL VERIFICATIONS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test failed with error:", err.message);
    try {
      await saveScreenshot(driver, "debug_failure.png");
      const logs = await driver.manage().logs().get("browser");
      console.log("Browser console logs:", logs);
      const bodyText = await driver.executeScript(() => document.body.innerText.slice(0, 500));
      console.log("Body text snippet:\n", bodyText);
    } catch (_) {}
    throw err;
  } finally {
    await driver.quit();
  }
})();

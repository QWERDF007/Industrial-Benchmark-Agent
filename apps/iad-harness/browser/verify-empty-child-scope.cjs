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
    console.log("  VERIFY EMPTY CHILD DATASET SCOPE BEHAVIOR");
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

    console.log("Navigating to 数据一致性 tab...");
    const navConsistency = await driver.wait(
      until.elementLocated(
        By.xpath("//nav//button[contains(., '标注一致性')] | //nav//button[contains(., '数据一致性')]")
      ),
      5000
    );
    await navConsistency.click();
    await driver.sleep(2500);

    // Verify initial state: table present
    const initialRows = await driver.findElements(By.css(".dc-table tbody tr"));
    console.log(`[Initial] Found ${initialRows.length} jobs in table.`);
    if (initialRows.length === 0) {
      throw new Error("Expected initial jobs table to have rows.");
    }

    // Open child dropdown
    console.log("Clicking child dataset trigger (#dc-child-trigger)...");
    const trigger = await driver.findElement(By.id("dc-child-trigger"));
    await trigger.click();
    await driver.sleep(600);

    // Uncheck all child checkboxes
    const checkboxes = await driver.findElements(By.css(".dc-child-option"));
    console.log(`Found ${checkboxes.length} child checkboxes. Unchecking all...`);
    for (const cb of checkboxes) {
      const checked = await cb.isSelected();
      if (checked) {
        await cb.click();
        await driver.sleep(200);
      }
    }

    // Close dropdown
    await trigger.click();
    await driver.sleep(1000);

    // Verify trigger text
    const triggerText = await trigger.getText();
    console.log(`[Check 1] Trigger text is: "${triggerText}"`);
    if (!triggerText.includes("请选择子数据集")) {
      throw new Error(`Expected trigger text to contain '请选择子数据集', got '${triggerText}'`);
    }

    // Verify jobs section empty state
    const jobEmptyEls = await driver.findElements(By.xpath('//div[contains(@class, "dc-empty") and contains(., "当前范围还没有检查作业")]'));
    console.log(`[Check 2] Jobs empty message elements found: ${jobEmptyEls.length}`);
    if (jobEmptyEls.length === 0) {
      throw new Error("Expected empty state message in jobs section!");
    }

    const currentRows = await driver.findElements(By.css(".dc-table tbody tr"));
    console.log(`[Check 3] Jobs table row count: ${currentRows.length}`);
    if (currentRows.length !== 0) {
      throw new Error(`Expected 0 job rows, got ${currentRows.length}`);
    }

    // Verify conflict section empty state
    const conflictEmptyEls = await driver.findElements(By.xpath('//div[contains(@class, "dc-empty") and contains(., "选择上方的检查作业后查看结果")]'));
    console.log(`[Check 4] Conflict empty message elements found: ${conflictEmptyEls.length}`);
    if (conflictEmptyEls.length === 0) {
      throw new Error("Expected empty state message in conflict section!");
    }

    const conflictCards = await driver.findElements(By.css(".dc-conflict-card"));
    console.log(`[Check 5] Conflict cards count: ${conflictCards.length}`);
    if (conflictCards.length !== 0) {
      throw new Error(`Expected 0 conflict cards, got ${conflictCards.length}`);
    }

    await saveScreenshot(driver, "fix_04_empty_child_scope_clean.png");
    console.log("  Successfully verified clean empty state when no child dataset is selected!");

    // Now test restoring by re-checking one child dataset
    console.log("\nRe-checking the first child dataset to verify restoration...");
    await trigger.click();
    await driver.sleep(500);
    const cb1 = (await driver.findElements(By.css(".dc-child-option")))[0];
    await cb1.click();
    await driver.sleep(500);
    await trigger.click();
    await driver.sleep(1000);

    const restoredTriggerText = await trigger.getText();
    console.log(`[Restore Check 1] Trigger text restored to: "${restoredTriggerText}"`);

    const restoredRows = await driver.findElements(By.css(".dc-table tbody tr"));
    console.log(`[Restore Check 2] Restored jobs count: ${restoredRows.length}`);
    if (restoredRows.length === 0) {
      throw new Error("Expected jobs table to be restored after re-checking child dataset!");
    }

    await saveScreenshot(driver, "fix_04_child_scope_restored.png");
    console.log("  Successfully verified restoration when child dataset is selected!");

    console.log("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<\n");
  } catch (err) {
    console.error("Test failed:", err);
    await saveScreenshot(driver, "empty_scope_error.png");
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
})();

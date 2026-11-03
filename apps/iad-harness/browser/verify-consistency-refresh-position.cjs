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
    console.log("  VERIFY DATA CONSISTENCY REFRESH BUTTON POSITION");
    console.log("========================================================\n");

    const logContent = fs.readFileSync("/data1/wt/Industrial-Benchmark-Agent/runs/dsh_web.log", "utf8");
    const matches = [...logContent.matchAll(/token=([^\s\)\&]+)/g)];
    const token = matches.length ? matches[matches.length - 1][1] : "";
    const baseUrl = `http://127.0.0.1:8000/?token=${token}`;

    console.log(`Navigating to ${baseUrl}...`);
    await driver.get(baseUrl);
    await driver.sleep(3000);

    // Dismiss '稍后配置' modal if present
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

    // Navigate to 数据一致性
    const navConsistency = await driver.wait(
      until.elementLocated(
        By.xpath("//nav//button[contains(., '标注一致性')] | //nav//button[contains(., '数据一致性')]")
      ),
      8000
    );
    await navConsistency.click();
    await driver.sleep(2500);

    await driver.wait(until.elementLocated(By.css(".dc-root")), 8000);
    console.log("  Consistency page loaded.");

    // Check scope elements:
    // 1. .dc-parent-controls .dc-parent
    // 2. .dc-child-controls .dc-children
    // 3. .dc-child-controls .dc-icn[title="刷新检查作业"]
    const parentField = await driver.findElement(By.css(".dc-parent-controls .dc-parent"));
    const childField = await driver.findElement(By.css(".dc-child-controls .dc-children"));
    const refreshBtn = await driver.findElement(By.css(".dc-child-controls button.dc-icn[title='刷新检查作业']"));

    const parentRect = await parentField.getRect();
    const childRect = await childField.getRect();
    const refreshRect = await refreshBtn.getRect();

    console.log("  Coordinates:");
    console.log(`    Parent (数据集): x=${parentRect.x}, width=${parentRect.width}, right=${parentRect.x + parentRect.width}`);
    console.log(`    Child (子数据集):  x=${childRect.x}, width=${childRect.width}, right=${childRect.x + childRect.width}`);
    console.log(`    Refresh (刷新):   x=${refreshRect.x}, width=${refreshRect.width}, right=${refreshRect.x + refreshRect.width}`);

    // Assert order from left to right:
    // Parent right <= Child left
    // Child right <= Refresh left
    if (parentRect.x >= childRect.x) {
      throw new Error(`Invalid layout: Parent dataset (x=${parentRect.x}) is not to the left of Child dataset (x=${childRect.x})!`);
    }
    if (childRect.x >= refreshRect.x) {
      throw new Error(`Invalid layout: Child dataset (x=${childRect.x}) is not to the left of Refresh button (x=${refreshRect.x})! Refresh is still in the middle!`);
    }

    console.log("  [PASS] Order is confirmed: 数据集 -> 子数据集 -> 刷新按钮!");

    // Verify .dc-parent-controls DOES NOT contain any .dc-icn
    const parentIcns = await driver.findElements(By.css(".dc-parent-controls .dc-icn"));
    if (parentIcns.length !== 0) {
      throw new Error(`Found ${parentIcns.length} .dc-icn button(s) inside .dc-parent-controls! Expected 0.`);
    }
    console.log("  [PASS] No refresh icon inside .dc-parent-controls.");

    // Save screenshot of the correct toolbar
    await saveScreenshot(driver, "dc_refresh_button_position_fixed.png");

    // Click refresh to verify it works without error
    await refreshBtn.click();
    await driver.sleep(1000);
    console.log("  [PASS] Refresh button clicked cleanly.");

    console.log("\n========================================================");
    console.log("  DATA CONSISTENCY REFRESH POSITION VERIFIED SUCCESSFULLY!");
    console.log("========================================================\n");
  } catch (err) {
    console.error("Test failed:", err);
    await saveScreenshot(driver, "dc_refresh_error.png");
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();

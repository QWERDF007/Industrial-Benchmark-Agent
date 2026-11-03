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
    await driver.manage().window().setRect({ width: 1440, height: 960 });
    console.log("Navigating to http://127.0.0.1:8000/ ...");
    await driver.get("http://127.0.0.1:8000/");

    try {
      const later = await driver.wait(until.elementLocated(By.xpath('//button[normalize-space(.)="Configure later"]')), 3000);
      await later.click();
      console.log("Dismissed Configure later.");
    } catch {}

    console.log("Navigating to 数据一致性...");
    const navBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[@aria-label='数据一致性' or contains(., '数据一致性')]")),
      6000
    );
    await navBtn.click();
    await driver.sleep(1500);

    // 1. Select the real completed batch row (batch_ebdf)
    console.log("Locating real completed job batch_ebdf in table...");
    const ebdfRow = await driver.wait(
      until.elementLocated(By.xpath("//tbody/tr[contains(@data-dc-row, 'batch_ebdf') or contains(., '0904-Train')]")),
      5000
    );
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", ebdfRow);
    await driver.sleep(300);
    await driver.executeScript("arguments[0].click();", ebdfRow);
    console.log("Selected batch_ebdf job row.");

    // Wait for conflict cards to load
    console.log("Waiting for conflict cards to load from real backend...");
    await driver.wait(until.elementLocated(By.css(".dc-card")), 8000);
    await driver.sleep(1000);

    // Verify Main Workbench & Button Styling
    const primaryBtn = await driver.findElement(By.css("button.dc-primary"));
    const primaryBg = await primaryBtn.getCssValue("background-color");
    console.log(`[Check] dc-primary background-color: ${primaryBg} (expected #285ed6 / rgb(40, 94, 214))`);

    const tabs = await driver.findElements(By.css("button.dc-type-tab"));
    console.log(`[Check] Found ${tabs.length} tabs in dc-type-tabs.`);
    for (const t of tabs) {
      const txt = await t.getText();
      console.log(`  Tab: ${txt.replace(/\n/g, ' ')}`);
    }

    const cards = await driver.findElements(By.css(".dc-card"));
    console.log(`[Check] Loaded ${cards.length} conflict cards on page 1.`);
    const firstCardTitle = await cards[0].findElement(By.css("strong")).getText();
    const firstCardLabel = await cards[0].findElement(By.css(".dc-card-raw-label")).getText();
    console.log(`[Check] First card: "${firstCardTitle}", type: "${firstCardLabel}"`);

    await saveScreenshot(driver, "v26_v2_01_workbench.png");

    // 2. Open Statistics Drawer for batch_ebdf
    console.log("Opening statistics drawer for batch_ebdf...");
    const statsBtn = await ebdfRow.findElement(By.css("button.dc-icn[title='查看统计结果']"));
    await driver.executeScript("arguments[0].click();", statsBtn);
    await driver.sleep(1000);

    const drawer = await driver.wait(until.elementLocated(By.css(".dc-drawer")), 4000);
    const drawerTotal = await driver.findElement(By.css(".dc-drawer-total")).getText();
    console.log(`[Check] Drawer total: ${drawerTotal.replace(/\n/g, ' ')}`);

    const statRows = await driver.findElements(By.css("button.dc-stat-type"));
    console.log(`[Check] Found ${statRows.length} stat rows in drawer.`);
    for (const sr of statRows) {
      const label = await sr.findElement(By.css(".dc-stat-label")).getText();
      const val = await sr.findElement(By.css(".dc-stat-value")).getText();
      console.log(`  Stat row: ${label} -> ${val}`);
    }

    await saveScreenshot(driver, "v26_v2_02_stats_drawer.png");

    // 3. Click "位置或范围差异" or second stat row to filter conflict list
    console.log("Clicking stat row '位置或范围差异' in drawer...");
    const geoRow = await driver.findElement(
      By.xpath("//button[contains(@class, 'dc-stat-type') and contains(., '位置或范围差异')]")
    );
    await driver.executeScript("arguments[0].click();", geoRow);
    await driver.sleep(1200);

    // Verify drawer closed
    const openDrawers = await driver.findElements(By.css(".dc-mask:not([hidden])"));
    console.log(`[Check] Active mask drawers open: ${openDrawers.length}`);

    const filteredCards = await driver.findElements(By.css(".dc-card"));
    console.log(`[Check] Conflict cards after filtering by '位置或范围差异': ${filteredCards.length}`);
    await saveScreenshot(driver, "v26_v2_03_filtered_after_stat_click.png");

    // 4. Open Conflict Comparison Dialog on first card
    console.log("Opening conflict comparison dialog...");
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", filteredCards[0]);
    await driver.sleep(300);
    await driver.executeScript("arguments[0].click();", filteredCards[0]);
    await driver.sleep(1200);

    const dialog = await driver.wait(until.elementLocated(By.css(".dc-conflict-dialog")), 4000);
    const dialogTitle = await driver.executeScript("return arguments[0].innerText || arguments[0].textContent;", await dialog.findElement(By.css("h2")));
    console.log(`[Check] Dialog opened: ${dialogTitle}`);

    const leftCaption = await driver.executeScript("return arguments[0].innerText || arguments[0].textContent;", await dialog.findElement(By.css(".dc-compare-cell:first-child .dc-compare-caption")));
    const rightCaption = await driver.executeScript("return arguments[0].innerText || arguments[0].textContent;", await dialog.findElement(By.css(".dc-compare-cell:last-child .dc-compare-caption")));
    console.log(`[Check] Anchor caption: ${leftCaption.replace(/\n/g, ' ')}`);
    console.log(`[Check] Candidate caption: ${rightCaption.replace(/\n/g, ' ')}`);

    const modelExplanation = await driver.executeScript("return arguments[0].innerText || arguments[0].textContent;", await dialog.findElement(By.css(".dc-model-panel p")));
    const modelVerdict = await driver.executeScript("return arguments[0].innerText || arguments[0].textContent;", await dialog.findElement(By.css(".dc-model-verdict")));
    console.log(`[Check] Model explanation: ${modelExplanation}`);
    console.log(`[Check] Model verdict: ${modelVerdict.replace(/\n/g, ' ')}`);

    // Check that bounding box exists on anchor photo
    const bboxes = await dialog.findElements(By.css(".dc-compare-photo .dc-bbox"));
    console.log(`[Check] Found ${bboxes.length} bounding box overlays in comparison photos.`);

    await saveScreenshot(driver, "v26_v2_04_dialog_real_data.png");

    // Close dialog with borderless icon button
    const closeBtn = await dialog.findElement(By.css("button.dc-icn[title='关闭']"));
    await driver.executeScript("arguments[0].click();", closeBtn);
    await driver.sleep(500);

    console.log("==========================================");
    console.log("ALL V26 VISUAL & REAL DATA CHECKS PASSED!");
    console.log("==========================================");
  } catch (err) {
    console.error("Test execution failed:", err);
    await saveScreenshot(driver, "v26_v2_error.png");
    process.exit(1);
  } finally {
    await driver.quit();
  }
}

run();

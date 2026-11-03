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
    console.log("  VERIFY CONFLICT DIALOG & ZOOM VIEWER BBOX FIXES");
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

    // Switch to consistency page
    console.log("Switching to 数据一致性 page...");
    const navConsistency = await driver.wait(
      until.elementLocated(
        By.xpath("//nav//button[contains(., '标注一致性')] | //nav//button[contains(., '数据一致性')]")
      ),
      8000
    );
    await navConsistency.click();
    await driver.sleep(3000);

    // Verify consistency page root
    await driver.wait(until.elementLocated(By.css(".dc-root")), 8000);
    console.log("Consistency page loaded successfully.");

    // Select the completed batch row batch_ebdf
    console.log("Locating completed batch_ebdf job row...");
    const batchRow = await driver.wait(
      until.elementLocated(By.css("tr[data-dc-row*='batch_ebdf']")),
      8000
    );
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", batchRow);
    await driver.sleep(500);
    await driver.executeScript("arguments[0].click();", batchRow);
    console.log("Selected batch_ebdf row, loading conflicts...");
    await driver.sleep(2500);

    // Find conflict card
    const card = await driver.wait(
      until.elementLocated(By.css(".dc-card[data-dc='open-conflict']")),
      8000
    );
    console.log("Found conflict card, clicking to open comparison dialog...");
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", card);
    await driver.sleep(500);
    await driver.executeScript("arguments[0].click();", card);
    await driver.sleep(2000);

    // 1. Verify dialog is open
    const dialog = await driver.wait(until.elementLocated(By.css(".dc-conflict-dialog")), 5000);
    console.log("Comparison dialog opened.");

    // 2. Check for "主图（固定）"
    const dialogText = await dialog.getText();
    const hasFixedMainTitle = dialogText.includes("主图（固定）");
    console.log(`Check: Contains '主图（固定）' text? ${hasFixedMainTitle ? "FAIL (Still present!)" : "PASS (Gone!)"}`);
    if (hasFixedMainTitle) {
      throw new Error("Validation failed: '主图（固定）' should NOT be present in dialog!");
    }

    // Check compare cell title element
    const compareTitles = await dialog.findElements(By.css(".dc-compare-title"));
    console.log(`Check: .dc-compare-title count: ${compareTitles.length} (Expected 0)`);
    if (compareTitles.length > 0) {
      throw new Error(`Validation failed: found ${compareTitles.length} .dc-compare-title elements!`);
    }

    // 3. Check bounding box in compare photo
    const bboxes = await dialog.findElements(By.css(".dc-compare-photo .dc-bbox"));
    console.log(`Found ${bboxes.length} bounding box elements in compare photos.`);
    if (bboxes.length > 0) {
      for (let i = 0; i < bboxes.length; i++) {
        const bg = await bboxes[i].getCssValue("background-color");
        const border = await bboxes[i].getCssValue("border-top-width");
        const borderColor = await bboxes[i].getCssValue("border-top-color");
        const w = await bboxes[i].getCssValue("width");
        const h = await bboxes[i].getCssValue("height");
        console.log(`  BBox ${i}: bg=${bg}, border=${border} ${borderColor}, size=${w}x${h}`);
        // Transparent is rgba(0, 0, 0, 0)
        const isTransparent = bg === "rgba(0, 0, 0, 0)" || bg === "transparent";
        console.log(`  BBox ${i} background is transparent (edge only): ${isTransparent ? "PASS" : "FAIL"}`);
        if (!isTransparent) {
          throw new Error(`BBox ${i} has non-transparent background: ${bg}`);
        }
      }
    }

    await saveScreenshot(driver, "fix_01_dialog_no_fixed_title_and_edge_bbox.png");

    // 4. Click photo to open zoom viewer
    const anchorPhoto = await dialog.findElement(By.css(".dc-compare-photo[data-dc='zoom-anchor']"));
    console.log("Clicking anchor compare photo to open FullscreenViewer...");
    await anchorPhoto.click();
    await driver.sleep(2000);

    // 5. Verify FullscreenViewer is open
    const fullViewer = await driver.wait(until.elementLocated(By.css(".full-dialog")), 5000);
    console.log("FullscreenViewer opened successfully!");

    // Check filename title in toolbar
    const toolbarTitle = await fullViewer.findElement(By.css(".full-file")).getText();
    console.log(`FullscreenViewer image title: '${toolbarTitle}'`);

    // Check annotation layer
    const annLayer = await fullViewer.findElement(By.css("#full-annotation-layer"));
    console.log("Found #full-annotation-layer in FullscreenViewer!");

    const zoomBboxes = await fullViewer.findElements(By.css("#full-annotation-layer .bbox"));
    console.log(`Found ${zoomBboxes.length} bounding box annotation(s) on zoomed image!`);
    if (zoomBboxes.length === 0) {
      throw new Error("Validation failed: FullscreenViewer has no bounding box annotations!");
    }

    for (let i = 0; i < zoomBboxes.length; i++) {
      const label = await zoomBboxes[i].getAttribute("data-label");
      const bg = await zoomBboxes[i].getCssValue("background-color");
      const border = await zoomBboxes[i].getCssValue("border-top-width");
      const borderColor = await zoomBboxes[i].getCssValue("border-top-color");
      const w = await zoomBboxes[i].getCssValue("width");
      const h = await zoomBboxes[i].getCssValue("height");
      console.log(`  Zoom BBox ${i}: label='${label}', bg=${bg}, border=${border} ${borderColor}, size=${w}x${h}`);
      const isTransparent = bg === "rgba(0, 0, 0, 0)" || bg === "transparent";
      console.log(`  Zoom BBox ${i} is transparent edge outline: ${isTransparent ? "PASS" : "FAIL"}`);
      if (!isTransparent) {
        throw new Error(`Zoom BBox ${i} has non-transparent background: ${bg}`);
      }
    }

    await saveScreenshot(driver, "fix_02_fullscreen_zoom_viewer_with_bbox.png");

    // Close zoom viewer by pressing Escape
    console.log("Closing FullscreenViewer via Escape key...");
    const body = await driver.findElement(By.css("body"));
    await body.sendKeys("\uE00C"); // Key.ESCAPE
    await driver.sleep(1000);

    // Verify returned to compare dialog
    const compareDialogStillOpen = (await driver.findElements(By.css(".dc-conflict-dialog"))).length > 0;
    console.log(`Compare dialog still open after closing zoom: ${compareDialogStillOpen}`);

    console.log("\n========================================================");
    console.log("  ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!");
    console.log("========================================================\n");
  } catch (err) {
    console.error("Test failed with error:", err);
    await saveScreenshot(driver, "dialog_fix_error.png");
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
})();

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
    console.log("  VERIFY CONFLICT DIALOG PHOTO BBOX EXACT ALIGNMENT");
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
    const navConsistency = await driver.wait(
      until.elementLocated(
        By.xpath("//nav//button[contains(., '标注一致性')] | //nav//button[contains(., '数据一致性')]")
      ),
      8000
    );
    await navConsistency.click();
    await driver.sleep(3000);

    // Select the completed batch row batch_ebdf
    const batchRow = await driver.wait(
      until.elementLocated(By.css("tr[data-dc-row*='batch_ebdf']")),
      8000
    );
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", batchRow);
    await driver.sleep(500);
    await driver.executeScript("arguments[0].click();", batchRow);
    await driver.sleep(2500);

    // Find conflict card
    const card = await driver.wait(
      until.elementLocated(By.css(".dc-card[data-dc='open-conflict']")),
      8000
    );
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", card);
    await driver.sleep(500);
    await driver.executeScript("arguments[0].click();", card);
    await driver.sleep(2000);

    // 1. Verify dialog is open
    const dialog = await driver.wait(until.elementLocated(By.css(".dc-conflict-dialog")), 5000);
    console.log("Comparison dialog opened.");

    // Locate anchor compare photo, img, and bbox
    const anchorPhoto = await dialog.findElement(By.css(".dc-compare-photo[data-dc='zoom-anchor']"));
    const anchorImg = await anchorPhoto.findElement(By.css("img"));
    const anchorBox = await anchorPhoto.findElement(By.css(".dc-bbox"));

    const photoRect = await anchorPhoto.getRect();
    const imgRect = await anchorImg.getRect();
    const boxRect = await anchorBox.getRect();

    console.log("\n  Anchor Metrics:");
    console.log(`    Photo container: x=${photoRect.x}, width=${photoRect.width}, right=${photoRect.x + photoRect.width}`);
    console.log(`    Rendered Image:  x=${imgRect.x}, width=${imgRect.width}, right=${imgRect.x + imgRect.width}`);
    console.log(`    Bounding Box:    x=${boxRect.x}, width=${boxRect.width}, right=${boxRect.x + boxRect.width}`);

    // Critical assertion: Bounding box must be strictly inside the rendered image, NOT in the gray margin!
    const isBoxInsideImgH = boxRect.x >= imgRect.x - 2 && (boxRect.x + boxRect.width) <= (imgRect.x + imgRect.width + 2);
    const isBoxInsideImgV = boxRect.y >= imgRect.y - 2 && (boxRect.y + boxRect.height) <= (imgRect.y + imgRect.height + 2);

    console.log(`  BBox is horizontally inside rendered image: ${isBoxInsideImgH ? "PASS" : "FAIL"}`);
    console.log(`  BBox is vertically inside rendered image:   ${isBoxInsideImgV ? "PASS" : "FAIL"}`);

    if (!isBoxInsideImgH) {
      throw new Error(`BBox is outside rendered image horizontally! Box [${boxRect.x}, ${boxRect.x + boxRect.width}] vs Img [${imgRect.x}, ${imgRect.x + imgRect.width}]`);
    }
    if (!isBoxInsideImgV) {
      throw new Error(`BBox is outside rendered image vertically! Box [${boxRect.y}, ${boxRect.y + boxRect.height}] vs Img [${imgRect.y}, ${imgRect.y + imgRect.height}]`);
    }

    // Locate candidate compare photo, img, and bbox
    const candPhoto = await dialog.findElement(By.css(".dc-compare-photo[data-dc='zoom-candidate']"));
    const candImg = await candPhoto.findElement(By.css("img"));
    const candBox = await candPhoto.findElement(By.css(".dc-bbox"));

    const candPhotoRect = await candPhoto.getRect();
    const candImgRect = await candImg.getRect();
    const candBoxRect = await candBox.getRect();

    console.log("\n  Candidate Metrics:");
    console.log(`    Photo container: x=${candPhotoRect.x}, width=${candPhotoRect.width}, right=${candPhotoRect.x + candPhotoRect.width}`);
    console.log(`    Rendered Image:  x=${candImgRect.x}, width=${candImgRect.width}, right=${candImgRect.x + candImgRect.width}`);
    console.log(`    Bounding Box:    x=${candBoxRect.x}, width=${candBoxRect.width}, right=${candBoxRect.x + candBoxRect.width}`);

    const isCandBoxInsideImgH = candBoxRect.x >= candImgRect.x - 2 && (candBoxRect.x + candBoxRect.width) <= (candImgRect.x + candImgRect.width + 2);
    const isCandBoxInsideImgV = candBoxRect.y >= candImgRect.y - 2 && (candBoxRect.y + candBoxRect.height) <= (candImgRect.y + candImgRect.height + 2);

    console.log(`  Candidate BBox is horizontally inside rendered image: ${isCandBoxInsideImgH ? "PASS" : "FAIL"}`);
    console.log(`  Candidate BBox is vertically inside rendered image:   ${isCandBoxInsideImgV ? "PASS" : "FAIL"}`);

    if (!isCandBoxInsideImgH) {
      throw new Error(`Candidate BBox is outside rendered image horizontally!`);
    }
    if (!isCandBoxInsideImgV) {
      throw new Error(`Candidate BBox is outside rendered image vertically!`);
    }

    await saveScreenshot(driver, "fix_03_compare_photo_bbox_exact_align.png");

    console.log("\n========================================================");
    console.log("  ALL CONFLICT BBOX ALIGNMENT ASSERTIONS PASSED!");
    console.log("========================================================\n");
  } catch (err) {
    console.error("Test failed:", err);
    await saveScreenshot(driver, "bbox_alignment_error.png");
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();

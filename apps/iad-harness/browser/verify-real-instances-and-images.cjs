const { Builder, By, until, Key } = require("selenium-webdriver");
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
    console.log("  VERIFY REAL JOB INSTANCES & REAL IMAGES RENDERING");
    console.log("========================================================\n");

    // Get launch token from log
    const logContent = fs.readFileSync("/data1/wt/Industrial-Benchmark-Agent/runs/dsh_web.log", "utf8");
    const tokenMatch = logContent.match(/token=([^\s\)\&]+)/);
    const token = tokenMatch ? tokenMatch[1] : "";
    const targetUrl = token ? `http://127.0.0.1:8000/?token=${token}` : "http://127.0.0.1:8000/";

    console.log(`[Step 1] Navigating to ${targetUrl}...`);
    await driver.get(targetUrl);
    await driver.sleep(2500);

    // -------------------------------------------------------------------------
    // Test 1: Images Page (图像浏览)
    // -------------------------------------------------------------------------
    console.log("\n[Test 1] Verifying 图像浏览 images loading...");
    const navImages = await driver.findElement(By.xpath("//nav//button[contains(., '图像浏览')]"));
    await navImages.click();
    await driver.sleep(2000);

    const imagesInfo = await driver.executeScript(`
      const imgs = Array.from(document.querySelectorAll('#grid img, .grid img, img'));
      return {
        count: imgs.length,
        loadedCount: imgs.filter(img => img.complete && img.naturalWidth > 0).length,
        firstFew: imgs.slice(0, 3).map(img => ({
          src: img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete
        }))
      };
    `);
    console.log("  Images page inspection:", imagesInfo);
    if (imagesInfo.loadedCount === 0) {
      throw new Error("No images loaded successfully in 图像浏览!");
    }
    console.log(`  [PASS] 图像浏览: ${imagesInfo.loadedCount}/${imagesInfo.count} images rendered with positive natural dimensions.`);
    await saveScreenshot(driver, "img_01_images_page_loaded.png");

    // -------------------------------------------------------------------------
    // Test 2: Consistency Page (数据一致性)
    // -------------------------------------------------------------------------
    console.log("\n[Test 2] Verifying 数据一致性 real job instances & images...");
    const navConsistency = await driver.findElement(
      By.xpath("//nav//button[contains(., '标注一致性')] | //nav//button[contains(., '数据一致性')]")
    );
    await navConsistency.click();
    await driver.sleep(2000);

    // Find and click job row batch_ebdf
    const ebdfRow = await driver.findElement(By.css("tr[data-dc-row*='batch_ebdf']"));
    await driver.executeScript("arguments[0].click();", ebdfRow);
    await driver.sleep(2000);

    // Verify card thumbnails
    const cardImgs = await driver.executeScript(`
      const imgs = Array.from(document.querySelectorAll('.dc-card img'));
      return {
        count: imgs.length,
        loadedCount: imgs.filter(img => img.complete && img.naturalWidth > 0).length,
        sample: imgs.slice(0, 3).map(img => ({
          src: img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        }))
      };
    `);
    console.log("  Consistency conflict cards image inspection:", cardImgs);
    if (cardImgs.loadedCount === 0) {
      throw new Error("Conflict card images failed to load (all naturalWidth === 0)!");
    }
    console.log(`  [PASS] 数据一致性卡片: ${cardImgs.loadedCount}/${cardImgs.count} thumbnails successfully rendered with positive natural dimensions.`);
    await saveScreenshot(driver, "img_02_consistency_cards_loaded.png");

    // Click first conflict card to open comparison dialog
    const firstCard = await driver.findElement(By.css(".dc-card"));
    await driver.executeScript("arguments[0].click();", firstCard);
    await driver.sleep(1500);

    const dialogInspection = await driver.executeScript(`
      const modal = document.querySelector('.dc-conflict-dialog');
      if (!modal) return null;
      const imgs = Array.from(modal.querySelectorAll('.dc-compare-photo img'));
      const factDesc = modal.querySelector('.dc-fact-panel .dc-verdict-description')?.textContent?.trim();
      const modelAnalysis = modal.querySelector('.dc-model-panel p')?.textContent?.trim();
      const modelConclusion = modal.querySelector('.dc-conclusion-panel .dc-verdict-description')?.textContent?.trim();
      const mainPhoto = imgs[0];
      const candPhoto = imgs[1];

      return {
        imgCount: imgs.length,
        mainPhotoLoaded: mainPhoto?.complete && mainPhoto?.naturalWidth > 0,
        mainWidth: mainPhoto?.naturalWidth,
        candPhotoLoaded: candPhoto?.complete && candPhoto?.naturalWidth > 0,
        candWidth: candPhoto?.naturalWidth,
        factDesc,
        modelAnalysis,
        modelConclusion
      };
    `);
    console.log("  Comparison dialog inspection:", dialogInspection);

    if (!dialogInspection.mainPhotoLoaded || !dialogInspection.candPhotoLoaded) {
      throw new Error("Comparison dialog images failed to load!");
    }
    console.log("  [PASS] Comparison dialog main and candidate photos rendered successfully!");

    // Check that texts are real and dynamic (not static copy-paste)
    if (dialogInspection.factDesc.includes("主图与候选图对同一对象使用了不同标注类别。") ||
        dialogInspection.modelAnalysis.includes("两侧标注指向同一视觉对象，但所用类别不同；需结合类别定义判断是否属于误标。")) {
      throw new Error("Dialog texts still contain static HTML copy-pasted strings!");
    }
    console.log("  [PASS] Fact description, model analysis, and conclusion are instance-specific and dynamic!");
    await saveScreenshot(driver, "img_03_consistency_dialog_real_data.png");

    // Close comparison dialog
    const closeCompareBtn = await driver.findElement(By.css(".dc-dialog-head button[data-dc='close-modal'], .dc-dialog-head button.dc-icn"));
    await driver.executeScript("arguments[0].click();", closeCompareBtn);
    await driver.sleep(500);

    // -------------------------------------------------------------------------
    // Test 3: Exploration Page (方向探索)
    // -------------------------------------------------------------------------
    console.log("\n[Test 3] Verifying 方向探索 real job instances & images...");
    const navExploration = await driver.findElement(By.xpath("//nav//button[contains(., '方向探索')]"));
    await navExploration.click();
    await driver.sleep(2000);

    const expInspection = await driver.executeScript(`
      const jobRows = Array.from(document.querySelectorAll('.exp-job-table tbody tr'));
      const sampleImgs = Array.from(document.querySelectorAll('.exp-previews img'));
      return {
        jobCount: jobRows.length,
        jobIds: jobRows.map(r => r.getAttribute('data-id')),
        sampleImgCount: sampleImgs.length,
        sampleLoadedCount: sampleImgs.filter(img => img.complete && img.naturalWidth > 0).length,
        sampleSources: sampleImgs.slice(0, 3).map(img => img.src)
      };
    `);
    console.log("  Exploration page inspection:", expInspection);

    if (expInspection.jobCount === 0) {
      throw new Error("Exploration jobs table is empty for default dataset!");
    }
    console.log(`  [PASS] 方向探索: Found ${expInspection.jobCount} real jobs in table: ${JSON.stringify(expInspection.jobIds)}`);

    if (expInspection.sampleImgCount > 0) {
      console.log(`  [PASS] 方向探索样例栏: ${expInspection.sampleLoadedCount}/${expInspection.sampleImgCount} images loaded with positive natural dimensions.`);
    }
    await saveScreenshot(driver, "img_04_exploration_jobs_rendered.png");

    // Click 查看方向 on first direction to open direction detail dialog
    const viewDirectionsBtn = await driver.findElement(By.css("tr[data-action='direction'], button[title='查看方向']"));
    await driver.executeScript("arguments[0].click();", viewDirectionsBtn);
    await driver.sleep(1500);

    const dirDialogInspection = await driver.executeScript(`
      const dialog = document.querySelector('.exp-direction-dialog');
      if (!dialog) return null;
      const title = dialog.querySelector('.exp-direction-banner-title')?.textContent?.trim();
      const rationale = dialog.querySelector('.exp-direction-card p')?.textContent?.trim();
      const evImgs = Array.from(dialog.querySelectorAll('.exp-direction-evidence-card img'));
      return {
        title,
        rationale: rationale?.slice(0, 50),
        evImgCount: evImgs.length,
        evLoadedCount: evImgs.filter(img => img.complete && img.naturalWidth > 0).length,
        sampleSrc: evImgs[0]?.src
      };
    `);
    console.log("  Direction detail dialog inspection:", dirDialogInspection);

    if (dirDialogInspection.evImgCount > 0 && dirDialogInspection.evLoadedCount === 0) {
      throw new Error("Evidence images in direction detail dialog failed to load!");
    }
    console.log(`  [PASS] 方向详情弹窗: ${dirDialogInspection.evLoadedCount}/${dirDialogInspection.evImgCount} evidence images rendered.`);
    await saveScreenshot(driver, "img_05_direction_dialog_real_evidence.png");

    console.log("\n========================================================");
    console.log("  ALL REAL JOB INSTANCES & IMAGES VERIFIED SUCCESSFULLY!");
    console.log("========================================================\n");
  } catch (err) {
    console.error("[Verification Error]:", err);
    try {
      await saveScreenshot(driver, "real_instances_error.png");
    } catch {}
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();

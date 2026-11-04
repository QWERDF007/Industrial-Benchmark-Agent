const { Builder, By, Key, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox.js");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const ARTIFACT_DIR = "/home/dell/.gemini/antigravity-cli/brain/a36a5c63-3c83-4b2c-b4ff-8a1730f771df";

const checks = [];
function chk(condition, name) {
  assert.ok(condition, name);
  checks.push(name);
  console.log("✓", name);
}

async function run() {
  const options = new firefox.Options().addArguments("-headless");
  options.setPreference("javascript.options.intl_segmenter", true);

  const driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder("/tmp/geckodriver"))
    .build();

  try {
    await driver.manage().window().setRect({ width: 1600, height: 950 });

    const logContent = fs.readFileSync("/data1/wt/Industrial-Benchmark-Agent/runs/dsh_web.log", "utf8");
    const matches = [...logContent.matchAll(/token=([^\s\)\&]+)/g)];
    const token = matches.length ? matches[matches.length - 1][1] : "";
    const url = `http://127.0.0.1:8000/?token=${token}`;
    console.log("Navigating to live app:", url);
    await driver.get(url);
    await driver.sleep(3000);

    // Dismiss config dialog if present
    try {
      const later = await driver.wait(
        until.elementLocated(By.xpath('//button[contains(., "稍后配置") or @aria-label="稍后配置"]')),
        2000
      );
      await later.click();
      await driver.sleep(1000);
    } catch (_) {}

    // =========================================================================
    // Part 1: Exploration Prompt Drawer (560px right-hand drawer)
    // =========================================================================
    console.log("\n--- 1. Testing Exploration Prompt Drawer ---");
    const expNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "方向探索") or @aria-label="方向探索"]')),
      5000
    );
    await expNav.click();
    await driver.sleep(2000);

    const promptBtns = await driver.findElements(By.css('button[data-exp="show-prompt"], button[title="查看提示词"]'));
    chk(promptBtns.length > 0, `找到探索提示词操作按钮 (${promptBtns.length} 个)`);
    await driver.executeScript("arguments[0].click();", promptBtns[0]);
    await driver.sleep(800);

    const drawer = await driver.wait(until.elementLocated(By.css(".exp-prompt-drawer")), 5000);
    chk(await drawer.isDisplayed(), "点击查看提示词成功弹出提示词抽屉");

    const drawerRect = await drawer.getRect();
    console.log(`Drawer Rect: x=${drawerRect.x}, y=${drawerRect.y}, w=${drawerRect.width}, h=${drawerRect.height}`);
    const winWidth = await driver.executeScript("return window.innerWidth;");
    chk(Math.abs(drawerRect.x + drawerRect.width - winWidth) <= 5, `提示词抽屉紧贴屏幕右侧边缘 (x+w: ${drawerRect.x + drawerRect.width}, winWidth: ${winWidth})`);
    chk(Math.abs(drawerRect.width - 560) <= 10, `提示词抽屉宽度为规范的 560px (实际: ${drawerRect.width}px)`);

    const scrDrawer = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "live_01_exploration_prompt_drawer.png"), Buffer.from(scrDrawer, "base64"));

    const closePromptBtn = await driver.findElement(By.css(".exp-prompt-close, .drawer-close, button[aria-label='关闭提示词抽屉']"));
    await closePromptBtn.click();
    await driver.sleep(500);

    // =========================================================================
    // Part 2: Image Browse (AnnotatedImageStage & FullscreenViewer)
    // =========================================================================
    console.log("\n--- 2. Testing Image Browse ---");
    const imgNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "图像浏览") or @aria-label="图像浏览"]')),
      5000
    );
    await imgNav.click();
    await driver.sleep(2000);

    const imgCards = await driver.findElements(By.css(".grid .card"));
    chk(imgCards.length > 0, "图像浏览展示图片卡片");
    await driver.executeScript("arguments[0].click();", imgCards[0]);
    await driver.sleep(1200);

    const detailOverlay = await driver.findElement(By.css(".detail-overlay"));
    chk(await detailOverlay.isDisplayed(), "打开图像详情弹窗");

    // Check AnnotatedImageStage bboxes and category labels
    const imgStage = await driver.findElement(By.css(".detail-preview .annotated-image-stage"));
    chk(imgStage !== null, "图像浏览详情使用统一的 AnnotatedImageStage 组件");

    const imgBboxes = await driver.findElements(By.css(".detail-preview .preview-overlay .bbox"));
    console.log(`Image Browse bboxes count: ${imgBboxes.length}`);
    if (imgBboxes.length > 0) {
      const label = await imgBboxes[0].getAttribute("data-label");
      chk(label !== null && label.length > 0, `图像浏览标注框带类别标签: ${label}`);
    }

    const scrImgDetail = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "live_02_images_detail_annotated.png"), Buffer.from(scrImgDetail, "base64"));

    // Open FullscreenViewer from Image Browse
    const previewBtn = await driver.findElement(By.id("detail-preview"));
    await previewBtn.click();
    await driver.sleep(800);

    const fsOverlay = await driver.wait(until.elementLocated(By.id("full-overlay")), 5000);
    chk(await fsOverlay.isDisplayed(), "原图检视器全屏打开");

    const fullFileName = await driver.findElement(By.id("full-file-name"));
    const fnColor = await fullFileName.getCssValue("color");
    console.log("Image Browse Fullscreen filename color:", fnColor);

    const zoomSelect = await driver.findElement(By.id("zoom"));
    const zoomColor = await zoomSelect.getCssValue("color");
    console.log("Image Browse Fullscreen zoom select color:", zoomColor);

    const zoomWrap = await driver.findElement(By.css(".full-actions .zoom-wrap"));
    const zoomWrapBg = await zoomWrap.getCssValue("background-color");
    console.log("Image Browse Fullscreen zoom wrap background:", zoomWrapBg);

    const scrImgFs = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "live_03_images_fullscreen.png"), Buffer.from(scrImgFs, "base64"));

    // Close FullscreenViewer and Detail Modal
    await driver.findElement(By.id("full-close")).click();
    await driver.sleep(500);
    await driver.findElement(By.id("close")).click();
    await driver.sleep(500);

    // =========================================================================
    // Part 3: Data Consistency (Unified AnnotatedImageStage, Candidate Loading & FullscreenViewer)
    // =========================================================================
    console.log("\n--- 3. Testing Data Consistency ---");
    const dcNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "数据一致性") or @aria-label="数据一致性"]')),
      5000
    );
    await dcNav.click();
    await driver.sleep(2000);

    const dcRows = await driver.findElements(By.css(".dc-table tbody tr"));
    chk(dcRows.length > 0, "数据一致性作业列表已加载");

    // Select row with conflicts
    for (const r of dcRows) {
      const text = await r.getText();
      if (text.includes("部分完成") || text.includes("已完成")) {
        await driver.executeScript("arguments[0].click();", r);
        await driver.sleep(1500);
        break;
      }
    }

    const conflictCards = await driver.findElements(By.css(".dc-card"));
    chk(conflictCards.length > 0, "数据一致性冲突卡片已加载");

    // Click first conflict card
    await driver.executeScript("arguments[0].click();", conflictCards[0]);
    await driver.sleep(1500);

    const compareMask = await driver.wait(until.elementLocated(By.id("dc-compare-mask")), 5000);
    chk(await compareMask.isDisplayed(), "冲突对比弹窗打开");

    // Verify both left and right cells use AnnotatedImageStage
    const dcStages = await compareMask.findElements(By.css(".annotated-image-stage"));
    chk(dcStages.length >= 2, `一致性对比双图统一复用 AnnotatedImageStage 组件 (找到 ${dcStages.length} 个)`);

    // Verify bboxes have data-label category tags
    const dcAnchorBboxes = await compareMask.findElements(By.css(".dc-compare-cell:first-child .preview-overlay .bbox"));
    const dcCandBboxes = await compareMask.findElements(By.css(".dc-compare-cell:nth-child(2) .preview-overlay .bbox"));
    console.log(`DC anchor bboxes: ${dcAnchorBboxes.length}, candidate bboxes: ${dcCandBboxes.length}`);

    if (dcAnchorBboxes.length > 0) {
      const aLabel = await dcAnchorBboxes[0].getAttribute("data-label");
      chk(aLabel !== null && aLabel.length > 0, `主图标注框具有明确类别标签 (类别: ${aLabel})`);
    }
    if (dcCandBboxes.length > 0) {
      const cLabel = await dcCandBboxes[0].getAttribute("data-label");
      chk(cLabel !== null && cLabel.length > 0, `候选图标注框具有明确类别标签 (类别: ${cLabel})`);
    }

    // Verify anchor image vs candidate image src are distinct
    const leftImg = await compareMask.findElement(By.css(".dc-compare-cell:first-child img"));
    const rightImg = await compareMask.findElement(By.css(".dc-compare-cell:nth-child(2) img"));
    const leftSrc = await leftImg.getAttribute("src");
    const rightSrc = await rightImg.getAttribute("src");
    chk(leftSrc !== rightSrc, `对比主图与候选图并非同一张图 (主图: ${leftSrc.slice(0, 45)}... vs 候选图: ${rightSrc.slice(0, 45)}...)`);

    // Verify candidate strip
    const candButtons = await compareMask.findElements(By.css(".dc-candidate-strip .dc-candidate"));
    chk(candButtons.length > 0, `候选图缩略图条显示候选按钮 (${candButtons.length} 个)`);

    const scrDcModal = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "live_04_consistency_annotated_compare.png"), Buffer.from(scrDcModal, "base64"));

    // Open FullscreenViewer from consistency candidate photo
    const rightPhotoBtn = await compareMask.findElement(By.css('div[data-dc="zoom-candidate"]'));
    await rightPhotoBtn.click();
    await driver.sleep(800);

    const dcFsOverlay = await driver.wait(until.elementLocated(By.id("full-overlay")), 5000);
    chk(await dcFsOverlay.isDisplayed(), "从数据一致性成功打开原图检视器");

    const dcFsFileName = await driver.findElement(By.id("full-file-name"));
    const dcFsFnColor = await dcFsFileName.getCssValue("color");
    console.log("DC Fullscreen filename color:", dcFsFnColor);
    chk(dcFsFnColor.includes("244, 247, 253") || dcFsFnColor.includes("255, 255, 255") || dcFsFnColor.includes("226, 232, 240"), `数据一致性全屏检视器文件名是清晰的白色字体 (实际: ${dcFsFnColor})`);

    const dcFsZoom = await driver.findElement(By.id("zoom"));
    const dcFsZoomColor = await dcFsZoom.getCssValue("color");
    console.log("DC Fullscreen zoom color:", dcFsZoomColor);
    chk(dcFsZoomColor.includes("244, 247, 253") || dcFsZoomColor.includes("255, 255, 255"), `数据一致性全屏检视器缩放下拉选择是白色字体并非黑底黑字 (实际: ${dcFsZoomColor})`);

    const dcFsZoomWrap = await driver.findElement(By.css(".full-actions .zoom-wrap"));
    const dcFsZoomWrapBg = await dcFsZoomWrap.getCssValue("background-color");
    console.log("DC Fullscreen zoom wrap bg:", dcFsZoomWrapBg);
    chk(dcFsZoomWrapBg.includes("rgba(255, 255, 255") || dcFsZoomWrapBg.includes("rgba(255,255,255"), `缩放选择控件为半透明白底样式 (实际: ${dcFsZoomWrapBg})`);

    // Verify FullscreenViewer bboxes have category labels
    const dcFsBboxes = await driver.findElements(By.css(".full-annotation-layer .bbox"));
    console.log(`DC Fullscreen bboxes count: ${dcFsBboxes.length}`);
    if (dcFsBboxes.length > 0) {
      const fsLabel = await dcFsBboxes[0].getAttribute("data-label");
      chk(fsLabel !== null && fsLabel.length > 0, `全屏检视器标注框具有类别标签 (类别: ${fsLabel})`);
    }

    const scrDcFs = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "live_05_consistency_fullscreen_white.png"), Buffer.from(scrDcFs, "base64"));

    // Close FullscreenViewer
    await driver.findElement(By.id("full-close")).click();
    await driver.sleep(500);

    // Close compare dialog
    const closeCompareBtn = await driver.findElement(By.css("#dc-compare-mask .dc-dialog-head-actions button[aria-label='关闭'], #dc-compare-mask .dc-dialog-footer button.dc-minor"));
    await closeCompareBtn.click();
    await driver.sleep(500);

    console.log("\n========================================================");
    console.log(`ALL UNIFIED LIGHTBOX & DRAWER CHECKS PASSED: ${checks.length}`);
    console.log("========================================================\n");
  } finally {
    await driver.quit();
  }
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});

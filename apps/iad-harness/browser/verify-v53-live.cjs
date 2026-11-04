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

    // Dismiss welcome/config dialog if present
    try {
      const later = await driver.wait(
        until.elementLocated(By.xpath('//button[contains(., "稍后配置") or @aria-label="稍后配置"]')),
        2000
      );
      await later.click();
      await driver.sleep(1000);
    } catch (_) {}

    // =========================================================================
    // Part 1: Dataset Management (V53-S01)
    // =========================================================================
    console.log("\n--- Testing Dataset Management (V53) ---");
    const managerNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "数据集管理") or @aria-label="数据集管理"]')),
      5000
    );
    await managerNav.click();
    await driver.sleep(2000);

    // V53-S01: Verify dataset summary text has no middle dot '·'
    const summaryEl = await driver.wait(until.elementLocated(By.id("summaryCount")), 5000);
    const summaryText = await summaryEl.getText();
    chk(!summaryText.includes("·"), `数据集管理文案已彻底移除中点分隔符 (当前文案: ${summaryText.slice(0, 40).replace(/\n/g, ' ')})`);

    const dsSearch = await driver.findElement(By.id("search"));
    const dsSearchRect = await dsSearch.getRect();
    chk(Math.abs(dsSearchRect.width - 220) <= 2, `数据集管理搜索框宽度统一为220px (${dsSearchRect.width}px)`);
    chk(Math.abs(dsSearchRect.height - 38) <= 2, `数据集管理搜索框高度统一为38px (${dsSearchRect.height}px)`);

    const scrManager = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v53_live_00_dataset_manager.png"), Buffer.from(scrManager, "base64"));

    // =========================================================================
    // Part 2: Image Browse (V53-S01 & Dialog Contract)
    // =========================================================================
    console.log("\n--- Testing Image Browse (V53) ---");
    const imgNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "图像浏览") or @aria-label="图像浏览"]')),
      5000
    );
    await imgNav.click();
    await driver.sleep(2500);

    // Verify pager text has no middle dot '·' (V53-S01)
    const pagers = await driver.findElements(By.css(".iba-job-pager, .pagination-page, .pagination-total, .page-total"));
    for (const pager of pagers) {
      const pText = await pager.getText();
      if (pText.includes("页")) {
        chk(!pText.includes("·"), `分页条文案无中点分隔符 (实际: ${pText})`);
      }
    }

    // Open Image Detail modal and test V52/V53 Dialog Contract
    const imgCards = await driver.findElements(By.css(".grid .card"));
    chk(imgCards.length > 0, "图像浏览成功展示图片卡片");
    await driver.executeScript("arguments[0].click();", imgCards[0]);
    await driver.sleep(1200);

    const detailOverlay = await driver.findElement(By.css(".detail-overlay"));
    chk(await detailOverlay.isDisplayed(), "点击图像卡片成功打开图像详情弹窗");

    const detailDialog = await driver.findElement(By.css(".detail-dialog"));
    const detailRect = await detailDialog.getRect();
    chk(detailRect.width <= 1260 + 2, `图像详情弹窗符合最大1260px规范 (实际宽度: ${detailRect.width}px)`);
    chk(detailRect.height <= 820 + 2, `图像详情弹窗符合最大820px规范 (实际高度: ${detailRect.height}px)`);

    const closeDetailBtn = await driver.findElement(By.css("#close, button.detail-close"));
    await closeDetailBtn.click();
    await driver.sleep(600);

    const scrImages = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v53_live_01_images_browse.png"), Buffer.from(scrImages, "base64"));

    // =========================================================================
    // Part 3: Direction Exploration (V53-S01, V53-S02, V53 Dialog Contract)
    // =========================================================================
    console.log("\n--- Testing Direction Exploration (V53) ---");
    const expNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "方向探索") or @aria-label="方向探索"]')),
      5000
    );
    await expNav.click();
    await driver.sleep(2500);

    // V53-S02: In Direction Exploration, sub-heading below "探索结果" MUST be ONLY the job ID (e.g. EX-2412)
    const selectedSub = await driver.wait(until.elementLocated(By.css(".exp-selected-sub")), 5000);
    const subText = (await selectedSub.getText()).trim();
    chk((/^EX-\d+$/i.test(subText) || /^explore_[a-f0-9]+$/i.test(subText)), `V53-S02: 探索结果副标题仅显示作业ID且无冗余状态文案 (实际: '${subText}')`);
    chk(!subText.includes("·"), "V53-S02: 探索结果副标题无中点分隔符");
    chk(!subText.includes("已完成") && !subText.includes("运行中") && !subText.includes("失败"), "V53-S02: 探索结果副标题已移除重复的状态文案");

    // Open Direction Detail Dialog and test visual contract
    const viewDetailBtns = await driver.findElements(By.css(".exp-view-detail-button"));
    chk(viewDetailBtns.length > 0, "存在候选方向查看详情按钮");
    await driver.executeScript("arguments[0].click();", viewDetailBtns[0]);
    await driver.sleep(1200);

    const dirDialog = await driver.findElement(By.css(".exp-direction-dialog"));
    chk(await dirDialog.isDisplayed(), "成功打开方向详情弹窗");
    const dirRect = await dirDialog.getRect();
    chk(dirRect.width <= 1260 + 2, `方向详情弹窗宽度符合最大1260px规范 (实际宽度: ${dirRect.width}px)`);
    chk(dirRect.height <= 820 + 2, `方向详情弹窗高度符合最大820px规范 (实际高度: ${dirRect.height}px)`);

    // Evidence viewport height strictly <= 172px
    const evViewports = await dirDialog.findElements(By.css(".exp-evidence-viewport"));
    if (evViewports.length > 0) {
      const vpRect = await evViewports[0].getRect();
      chk(vpRect.height <= 174, `证据图片视口高度保持在约172px不被多余空间拉伸 (实际高度: ${vpRect.height}px)`);
      
      const evImgs = await evViewports[0].findElements(By.css(".exp-direction-evidence-card img"));
      if (evImgs.length > 0) {
        const imgR = await evImgs[0].getRect();
        chk(imgR.height <= 110, `证据缩略图高度控制在约108px (实际高度: ${imgR.height}px)`);
      }
    }

    // Evidence reference token color is standard ink #172338 (rgb(23, 35, 56)), not blue link
    const evRefs = await dirDialog.findElements(By.css(".exp-evidence-ref"));
    if (evRefs.length > 0) {
      const refColor = await evRefs[0].getCssValue("color");
      chk(refColor === "rgb(23, 35, 56)", `证据参考标签文字颜色为标准暗色墨水色 (实际: ${refColor})`);
    }

    const scrDirDialog = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v53_live_03_direction_detail.png"), Buffer.from(scrDirDialog, "base64"));

    // Close direction detail dialog
    const closeDirBtn = await dirDialog.findElement(By.css(".exp-direction-icon[aria-label='关闭详情'], button.modal-x, .exp-dialog-head button"));
    await closeDirBtn.click();
    await driver.sleep(600);

    const scrExp = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v53_live_02_exploration.png"), Buffer.from(scrExp, "base64"));

    // =========================================================================
    // Part 4: Knowledge Page (V53-S01)
    // =========================================================================
    console.log("\n--- Testing Knowledge Page (V53) ---");
    const kbNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "知识挖掘") or @aria-label="知识挖掘"]')),
      5000
    );
    await kbNav.click();
    await driver.sleep(2500);

    // Verify pager and items do not have middle dot
    const kbPagers = await driver.findElements(By.css(".iba-job-pager"));
    for (const kp of kbPagers) {
      const kpText = await kp.getText();
      chk(!kpText.includes("·"), `知识挖掘分页条无中点分隔符 (实际: ${kpText})`);
    }

    const scrKb = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v53_live_04_knowledge.png"), Buffer.from(scrKb, "base64"));

    // =========================================================================
    // Part 5: Data Consistency (V53-S01 & Dialog Contract)
    // =========================================================================
    console.log("\n--- Testing Data Consistency (V53) ---");
    const dcNav = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "数据一致性") or @aria-label="数据一致性"]')),
      5000
    );
    await dcNav.click();
    await driver.sleep(2500);

    const dcRows = await driver.findElements(By.css(".dc-table tbody tr"));
    chk(dcRows.length > 0, "数据一致性作业列表已加载");

    await driver.executeScript("arguments[0].click();", dcRows[0]);
    await driver.sleep(1500);

    // Verify pager has no middle dot
    const dcPagers = await driver.findElements(By.css(".iba-job-pager, .dc-counter-pager"));
    for (const dp of dcPagers) {
      const dpText = await dp.getText();
      chk(!dpText.includes("·"), `数据一致性分页无中点分隔符 (实际: ${dpText})`);
    }

    const dcCards = await driver.findElements(By.css(".dc-card"));
    chk(dcCards.length > 0, "数据一致性渲染冲突卡片");

    // Open Conflict Dialog and test V52/V53 Dialog Visual Contract
    await driver.executeScript("arguments[0].click();", dcCards[0]);
    await driver.sleep(1500);

    const compareMask = await driver.wait(until.elementLocated(By.id("dc-compare-mask")), 5000);
    chk(await compareMask.isDisplayed(), "打开标注冲突对比弹窗");

    const conflictDialog = await compareMask.findElement(By.css(".dc-conflict-dialog, .dc-dialog[role='dialog']"));
    const confRect = await conflictDialog.getRect();
    chk(confRect.width <= 1260 + 2, `标注冲突对比弹窗宽度符合最大1260px (实际: ${confRect.width}px)`);
    chk(confRect.height <= 820 + 2, `标注冲突对比弹窗高度符合最大820px (实际: ${confRect.height}px)`);

    // Verify candidate thumbnails strip visible
    const candStrip = await driver.findElement(By.css(".dc-candidate-strip"));
    const candStripRect = await candStrip.getRect();
    chk(candStripRect.height >= 75, `标注冲突对比缩略图条完整可见 (${candStripRect.height}px)`);

    const scrModal = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v53_live_06_conflict_dialog.png"), Buffer.from(scrModal, "base64"));

    // Close conflict modal
    const closeCompareBtn = await driver.findElement(By.css("#dc-compare-mask .dc-dialog-head-actions button[aria-label='关闭'], #dc-compare-mask .dc-dialog-footer button.dc-minor"));
    await closeCompareBtn.click();
    await driver.sleep(600);

    const scrDc = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v53_live_05_consistency.png"), Buffer.from(scrDc, "base64"));

    console.log("\n========================================");
    console.log(`ALL V53 LIVE SERVER CHECKS PASSED: ${checks.length}`);
    console.log("========================================\n");
  } finally {
    await driver.quit();
  }
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
